import "dotenv/config"
import express from "express"
import http from "http"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import rateLimit from "express-rate-limit"
import { Server as SocketIOServer } from "socket.io"
import swaggerJsdoc from "swagger-jsdoc"
import swaggerUi from "swagger-ui-express"

import systemRoutes from "./routes/system.js"
import dockerRoutes from "./routes/docker.js"
import kubernetesRoutes from "./routes/kubernetes.js"
import logsRoutes from "./routes/logs.js"
import aiRoutes from "./routes/ai.js"
import terminalRoutes from "./routes/terminal.js"
import authRoutes from "./routes/auth.js"
import cicdRoutes from "./routes/cicd.js"
import agentRoutes from "./routes/agent.js"
import deployRoutes from "./routes/deploy.js"
import { setupSocketHandlers } from "./socket/index.js"
import { seedDefaultUser } from "./services/auth.js"

const app = express()
const server = http.createServer(app)

const ALLOWED_ORIGINS = [
  process.env.CORS_ORIGIN,
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
  /^https?:\/\/.*\.vercel\.app$/,
].filter(Boolean)

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    const allowed = ALLOWED_ORIGINS.some((o) =>
      typeof o === "string" ? o === origin : o.test(origin)
    )
    if (allowed) return callback(null, true)
    callback(new Error("Not allowed by CORS"))
  },
  credentials: true,
}

const io = new SocketIOServer(server, {
  cors: corsOptions,
})

app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors(corsOptions))
app.use(morgan("dev"))
app.use(express.json({ limit: "1mb" }))

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[Error]", err.message)
  res.status(500).json({ success: false, error: err.message || "Internal server error" })
})

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests, please try again later" },
})
app.use("/api", limiter)

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Devi AI DevOps API",
      version: "2.0.0",
      description: "Production-grade AI-powered DevOps operating system API",
    },
    servers: [{ url: `http://localhost:${process.env.PORT || 4000}`, description: "Development" }],
    components: {
      securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
    },
  },
  apis: ["./src/routes/*.ts"],
})
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }))
app.get("/api/docs.json", (_req, res) => res.json(swaggerSpec))

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), version: "2.0.0" })
})

app.use("/api/auth", authRoutes)
app.use("/api/system", systemRoutes)
app.use("/api/docker", dockerRoutes)
app.use("/api/kubernetes", kubernetesRoutes)
app.use("/api/logs", logsRoutes)
app.use("/api/ai", aiRoutes)
app.use("/api/terminal", terminalRoutes)
app.use("/api/cicd", cicdRoutes)
app.use("/api/agent", agentRoutes)
app.use("/api/docker", deployRoutes)

app.set("io", io)
setupSocketHandlers(io)

seedDefaultUser()

const PORT = parseInt(process.env.PORT || "4000")

if (!process.env.VERCEL) {
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`\n  ✦ Devi AI DevOps Platform v2.0.0`)
    console.log(`  ──────────────────────────────────`)
    console.log(`  REST API  : http://0.0.0.0:${PORT}/api`)
    console.log(`  API Docs  : http://0.0.0.0:${PORT}/api/docs`)
    console.log(`  WebSocket : ws://0.0.0.0:${PORT}`)
    console.log(`  Health    : http://0.0.0.0:${PORT}/api/health\n`)
  })
}

export default app
