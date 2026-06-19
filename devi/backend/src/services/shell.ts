import { exec, spawn } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

const ALLOWED_PREFIXES = [
  "docker", "kubectl", "helm", "git", "npm", "node", "cat",
  "ls", "ps", "top", "df", "du", "free", "uname", "whoami",
  "echo", "ping", "curl", "wget", "tail", "head", "grep",
  "awk", "sed", "sort", "wc", "cut", "find", "which",
]

const BLOCKED_PATTERNS = [
  /rm\s+-rf/, /rm\s+-r\s+/, /rm\s+-f\s+/,
  /shutdown/, /reboot/, /halt/, /poweroff/,
  /mkfs/, /format/, /dd\s+/, /fdisk/, /parted/,
  /chmod\s+777/, /chown\s+-R/, /chattr/,
  /:\(\)\s*\{/, /wget.*\|\s*bash/, /curl.*\|\s*bash/,
  /sudo/, /su\s+/, /passwd/, /useradd/, /userdel/,
  />/,
  /iptables/, /ufw/, /systemctl/, /service/,
  /eval/, /exec.*\$/, /`.*`/,
]

const MAX_OUTPUT_LENGTH = 100 * 1024
const COMMAND_TIMEOUT = 30000

export interface ShellResult {
  stdout: string
  stderr: string
  exitCode: number | null
  command: string
  duration: number
}

export interface ShellCommand {
  command: string
  args: string[]
}

export class ShellExecutionError extends Error {
  constructor(
    message: string,
    public code: "BLOCKED" | "INVALID" | "TIMEOUT" | "ERROR",
  ) {
    super(message)
    this.name = "ShellExecutionError"
  }
}

function parseCommand(input: string): ShellCommand {
  const trimmed = input.trim()
  if (!trimmed) throw new ShellExecutionError("Empty command", "INVALID")

  const parts: string[] = []
  let current = ""
  let inQuote: string | null = null

  for (const char of trimmed) {
    if (char === '"' || char === "'") {
      if (inQuote === char) { inQuote = null; continue }
      if (!inQuote) { inQuote = char; continue }
    }
    if (char === " " && !inQuote) {
      if (current) { parts.push(current); current = "" }
      continue
    }
    current += char
  }
  if (current) parts.push(current)

  if (parts.length === 0) throw new ShellExecutionError("Empty command", "INVALID")
  return { command: parts[0].toLowerCase(), args: parts.slice(1) }
}

export function validateCommand(input: string): { valid: boolean; error?: string } {
  try {
    const parsed = parseCommand(input)

    const isAllowed = ALLOWED_PREFIXES.some((p) => parsed.command === p || parsed.command.startsWith(p + "."))
    if (!isAllowed) {
      return { valid: false, error: `Command "${parsed.command}" is not in the allowed list` }
    }

    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(input.toLowerCase())) {
        return { valid: false, error: `Command blocked: matches dangerous pattern` }
      }
    }

    return { valid: true }
  } catch (e) {
    return { valid: false, error: (e as Error).message }
  }
}

export async function executeCommand(input: string): Promise<ShellResult> {
  const validation = validateCommand(input)
  if (!validation.valid) {
    throw new ShellExecutionError(validation.error!, "BLOCKED")
  }

  const start = Date.now()
  try {
    const { stdout, stderr } = await execAsync(input, {
      timeout: COMMAND_TIMEOUT,
      maxBuffer: MAX_OUTPUT_LENGTH,
      shell: process.platform === "win32" ? "powershell.exe" : "/bin/bash",
    })

    return {
      stdout: stdout.slice(0, MAX_OUTPUT_LENGTH),
      stderr: stderr.slice(0, MAX_OUTPUT_LENGTH),
      exitCode: 0,
      command: input,
      duration: Date.now() - start,
    }
  } catch (err: any) {
    if (err.killed) {
      throw new ShellExecutionError(`Command timed out after ${COMMAND_TIMEOUT}ms`, "TIMEOUT")
    }
    return {
      stdout: err.stdout?.slice(0, MAX_OUTPUT_LENGTH) || "",
      stderr: err.stderr?.slice(0, MAX_OUTPUT_LENGTH) || err.message || "",
      exitCode: err.code || 1,
      command: input,
      duration: Date.now() - start,
    }
  }
}

export function streamCommand(
  input: string,
  onData: (data: string) => void,
  onError: (data: string) => void,
  onClose: (code: number | null) => void,
): { abort: () => void } {
  const parsed = parseCommand(input)

  const child = spawn(parsed.command, parsed.args, {
    shell: process.platform === "win32" ? "powershell.exe" : "/bin/bash",
    timeout: COMMAND_TIMEOUT,
  })

  child.stdout?.on("data", (data: Buffer) => onData(data.toString()))
  child.stderr?.on("data", (data: Buffer) => onError(data.toString()))
  child.on("close", (code) => onClose(code))
  child.on("error", (err) => onError(err.message))

  return {
    abort: () => {
      if (process.platform === "win32") {
        child.kill()
      } else {
        child.kill("SIGTERM")
        setTimeout(() => child.kill("SIGKILL"), 3000)
      }
    },
  }
}
