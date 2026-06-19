import { Router, Request, Response } from "express"
import {
  deployContainer,
  createContainerSimple,
  removeContainer,
  isDockerReachable,
  generateComposeYaml,
  generateDockerfile,
  detectProjectType,
  buildImage,
  pullImage,
  getContainerLogs,
} from "../services/docker.js"
import { parseDeployCommand, getStackTemplate } from "../services/parser.js"
import { validateDeployRequest, validateImage, EXECUTION_TIMEOUT_MS } from "../services/safety.js"

const router = Router()

function emitProgress(req: Request, message: string) {
  const io = (req.app as any).get("io")
  if (io) io.emit("deployment:progress", { message, timestamp: new Date().toISOString() })
}

router.post("/parse", (req: Request, res: Response) => {
  const { text } = req.body
  if (!text) return res.status(400).json({ success: false, error: "text is required" })
  const parsed = parseDeployCommand(text)
  res.json({ success: true, data: parsed, timestamp: new Date().toISOString() })
})

router.post("/create", async (req: Request, res: Response) => {
  const { image, name, ports, env, volumes } = req.body
  if (!image) return res.status(400).json({ success: false, error: "Image is required" })

  const safety = validateDeployRequest({ image, name, ports, env, volumes })
  if (!safety.safe) return res.status(400).json({ success: false, error: safety.reason })

  if (!(await isDockerReachable())) {
    return res.json({ success: true, data: { id: "sim", name: name || "container", message: `Simulated: container created from "${image}" (Docker unavailable)` }, timestamp: new Date().toISOString() })
  }

  try {
    emitProgress(req, `Pulling image ${image}...`)
    await withTimeout(pullImage(image, (msg) => emitProgress(req, msg)).catch(() => { }), 20000, `Pull ${image}`)

    emitProgress(req, `Creating container ${name || image}...`)
    const result = await withTimeout(createContainerSimple(image, name || `devi-${Date.now()}`, ports, env, volumes), 15000, `Create ${name || image}`)
    emitProgress(req, `Container ${result.name} created successfully`)
    res.json({ success: true, data: result, timestamp: new Date().toISOString() })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to create container" })
  }
})

router.post("/deploy", async (req: Request, res: Response) => {
  const { image, name, ports, env, volumes, start } = req.body
  if (!image) return res.status(400).json({ success: false, error: "Image is required" })

  const safety = validateDeployRequest({ image, name, ports, env, volumes })
  if (!safety.safe) return res.status(400).json({ success: false, error: safety.reason })

  if (!(await isDockerReachable())) {
    return res.json({ success: true, data: { id: "sim", name: name || "container", message: `Simulated: "${image}" deployed (Docker unavailable)` }, timestamp: new Date().toISOString() })
  }

  try {
    emitProgress(req, `Pulling image ${image}...`)
    await pullImage(image, (msg) => emitProgress(req, msg)).catch(() => { })

    const containerName = name || `devi-${Date.now()}`
    emitProgress(req, `Creating container ${containerName}...`)
    const container = await createContainerSimple(image, containerName, ports, env, volumes)

    if (start !== false) {
      emitProgress(req, `Starting container ${containerName}...`)
      const { default: Docker } = await import("dockerode")
      const docker = new Docker()
      const dc = docker.getContainer(container.id)
      await dc.start()
    }

    emitProgress(req, `${image} deployed successfully as "${containerName}"`)
    res.json({ success: true, data: { ...container, started: start !== false }, timestamp: new Date().toISOString() })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to deploy" })
  }
})

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)),
  ])
}

router.post("/compose", async (req: Request, res: Response) => {
  const { stack, image, name, ports, env, volumes } = req.body

  try {
    if (stack) {
      const template = getStackTemplate(stack.toLowerCase())
      if (!template) return res.status(400).json({ success: false, error: `Unknown stack: ${stack}` })

      const io = (req.app as any).get("io")
      if (io) io.emit("deployment:start", { stack, timestamp: new Date().toISOString() })

      for (const svc of template.services) {
        emitProgress(req, `Deploying ${svc.name} (${svc.image})...`)
        const portArr = svc.ports ? [{ host: parseInt(svc.ports.split(":")[0]), container: parseInt(svc.ports.split(":")[1]) }] : undefined
        try {
          await withTimeout(pullImage(svc.image, (msg) => emitProgress(req, msg)).catch(() => {}), 20000, `Pull ${svc.image}`)
          const result = await withTimeout(createContainerSimple(svc.image, svc.name, portArr, svc.env), 15000, `Create ${svc.name}`)
          try {
            const { default: Docker } = await import("dockerode")
            const localDocker = new Docker()
            const dc = localDocker.getContainer(result.id)
            await withTimeout(dc.start(), 10000, `Start ${svc.name}`)
          } catch {}
          emitProgress(req, `${svc.name} deployed successfully`)
        } catch (e: any) {
          emitProgress(req, `${svc.name} deployment note: ${e.message}`)
        }
      }

      const io2 = (req.app as any).get("io")
      if (io2) io2.emit("deployment:success", { stack, message: `${stack} stack deployed`, timestamp: new Date().toISOString() })

      return res.json({
        success: true,
        data: { stack, message: `${stack} stack deployment initiated`, composeYaml: template.compose, services: template.services.length },
        timestamp: new Date().toISOString(),
      })
    }

    const yaml = generateComposeYaml(image || "nginx:alpine", name || "service", ports, env, volumes)
    res.json({ success: true, data: { composeYaml: yaml, message: "Compose file generated" }, timestamp: new Date().toISOString() })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to process compose" })
  }
})

router.post("/containerize", async (req: Request, res: Response) => {
  const { projectPath, imageName } = req.body
  const targetPath = projectPath || process.cwd()

  try {
    const projectType = await detectProjectType(targetPath)
    const dockerfile = await generateDockerfile(projectType)
    const tag = imageName || `devi-${projectType}:latest`

    emitProgress(req, `Detected project type: ${projectType}`)
    emitProgress(req, `Generated Dockerfile for ${projectType}`)

    const io = (req.app as any).get("io")
    if (io) io.emit("deployment:start", { type: "containerize", projectType, timestamp: new Date().toISOString() })

    if (await isDockerReachable()) {
      emitProgress(req, `Building image ${tag}...`)
      try {
        const fs = await import("fs")
        const dockerfilePath = require("path").join(targetPath, "Dockerfile")
        if (!fs.existsSync(dockerfilePath)) {
          fs.writeFileSync(dockerfilePath, dockerfile)
          emitProgress(req, "Dockerfile written to project directory")
          const dotdockerignore = require("path").join(targetPath, ".dockerignore")
          if (!fs.existsSync(dotdockerignore)) {
            fs.writeFileSync(dotdockerignore, `node_modules\n.git\n.env\ndist\n.next\n`)
            emitProgress(req, ".dockerignore written")
          }
        }
        const builtTag = await buildImage(targetPath, tag, (msg) => emitProgress(req, msg))
        emitProgress(req, `Image ${builtTag} built successfully`)

        const result = await deployContainer(tag, `${tag.replace(/[^a-z0-9]/g, "-")}-container`)
        emitProgress(req, `Container ${result.name} started from built image`)

        if (io) io.emit("deployment:success", { type: "containerize", projectType, tag, containerName: result.name, timestamp: new Date().toISOString() })

        return res.json({ success: true, data: { projectType, dockerfile, tag, container: result, message: `Project containerized as "${tag}" and deployed as "${result.name}"` }, timestamp: new Date().toISOString() })
      } catch (buildErr: any) {
        emitProgress(req, `Build process: ${buildErr.message}. Returning generated Dockerfile.`)
      }
    }

    res.json({
      success: true,
      data: { projectType, dockerfile, tag, message: `Dockerfile generated for ${projectType} project. Build simulated (Docker unavailable for build).` },
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to containerize" })
  }
})

router.get("/logs/:id", async (req: Request, res: Response) => {
  const id = req.params.id as string
  const tail = Math.min(Math.max(parseInt(req.query.tail as string) || 100, 1), 5000)

  if (!(await isDockerReachable())) {
    return res.json({ success: true, data: { source: id, lines: [], message: "Docker unavailable" }, timestamp: new Date().toISOString() })
  }

  try {
    const logs = await getContainerLogs(id, tail)
    res.json({ success: true, data: { source: id, lines: logs, total: logs.length }, timestamp: new Date().toISOString() })
  } catch (err: any) {
    res.status(404).json({ success: false, error: err.message || "Container not found" })
  }
})

export default router
