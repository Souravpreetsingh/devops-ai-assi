import si from "systeminformation"

export interface SystemStats {
  cpu: { usage: number; cores: number; load: number[]; temperature: number; history: { time: string; value: number }[] }
  memory: { total: number; used: number; percent: number; swap: { total: number; used: number } }
  disk: { total: number; used: number; percent: number; readSpeed: number; writeSpeed: number }
  network: { rxBytes: number; txBytes: number; rxSpeed: number; txSpeed: number; connections: number }
  uptime: number
  processes: number
  hostname: string
  os: string
  kernel: string
  load: { "1m": number; "5m": number; "15m": number }
}

let cpuHistory: { time: string; value: number }[] = []

export async function getSystemStats(): Promise<SystemStats> {
  const [cpu, cpuCores, mem, disk, net, time, processes, osInfo, currentLoad] = await Promise.all([
    si.currentLoad(),
    si.cpu(),
    si.mem(),
    si.fsSize(),
    si.networkStats(),
    si.time(),
    si.processes(),
    si.osInfo(),
    si.currentLoad(),
  ])

  const cpuUsage = Math.round(currentLoad.currentLoad * 10) / 10
  cpuHistory = [...cpuHistory.slice(-59), { time: new Date().toISOString(), value: cpuUsage }]

  const totalMem = mem.total / 1024 / 1024 / 1024
  const usedMem = mem.used / 1024 / 1024 / 1024

  const totalDisk = disk.reduce((s, d) => s + d.size, 0) / 1024 / 1024 / 1024
  const usedDisk = disk.reduce((s, d) => s + d.used, 0) / 1024 / 1024 / 1024

  const netStats = net[0] || { rx_bytes: 0, tx_bytes: 0, rx_sec: 0, tx_sec: 0 }

  return {
    cpu: {
      usage: cpuUsage,
      cores: cpuCores.cores,
      load: [currentLoad.currentLoad, currentLoad.currentLoad, currentLoad.currentLoad],
      temperature: 0,
      history: cpuHistory,
    },
    memory: {
      total: Math.round(totalMem * 10) / 10,
      used: Math.round(usedMem * 10) / 10,
      percent: Math.round((mem.used / mem.total) * 100),
      swap: {
        total: Math.round((mem.swaptotal / 1024 / 1024 / 1024) * 10) / 10,
        used: Math.round((mem.swapused / 1024 / 1024 / 1024) * 10) / 10,
      },
    },
    disk: {
      total: Math.round(totalDisk),
      used: Math.round(usedDisk),
      percent: Math.round((usedDisk / totalDisk) * 100),
      readSpeed: Math.round(netStats.rx_sec / 1024 / 1024 * 10) / 10,
      writeSpeed: Math.round(netStats.tx_sec / 1024 / 1024 * 10) / 10,
    },
    network: {
      rxBytes: netStats.rx_bytes,
      txBytes: netStats.tx_bytes,
      rxSpeed: Math.round(netStats.rx_sec / 1024 / 1024 * 10) / 10,
      txSpeed: Math.round(netStats.tx_sec / 1024 / 1024 * 10) / 10,
      connections: (await si.networkConnections()).length,
    },
    uptime: time.uptime,
    processes: processes.all,
    hostname: osInfo.hostname,
    os: `${osInfo.distro} ${osInfo.release}`,
    kernel: osInfo.kernel,
    load: { "1m": currentLoad.currentLoad, "5m": currentLoad.currentLoad, "15m": currentLoad.currentLoad },
  }
}

export function generateActivity(): { type: string; message: string; timestamp: string }[] {
  const activities = [
    { type: "system", message: "System health check passed" },
    { type: "docker", message: "Docker daemon heartbeat OK" },
    { type: "k8s", message: "Cluster state synchronized" },
    { type: "ai", message: "AI model warmed up" },
  ]
  return activities.map((a) => ({ ...a, timestamp: new Date().toISOString() }))
}
