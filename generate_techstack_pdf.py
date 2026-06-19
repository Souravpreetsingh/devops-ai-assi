from fpdf import FPDF

class TechStackPDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 16)
        self.set_text_color(138, 235, 255)
        self.cell(0, 10, "Devi AI - Technology Stack Summary", align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(138, 235, 255)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(4)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(100, 100, 100)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")

    def section_title(self, title):
        self.set_font("Helvetica", "B", 13)
        self.set_text_color(220, 220, 255)
        self.set_fill_color(25, 25, 50)
        self.cell(0, 9, f"  {title}", fill=True, new_x="LMARGIN", new_y="NEXT")
        self.ln(3)

    def tech_table(self, items):
        self.set_font("Helvetica", "", 9)
        col_w = [60, 30, 100]
        self.set_fill_color(20, 20, 40)
        self.set_text_color(200, 200, 200)
        for label, val, note in items:
            if self.get_y() > 260:
                self.add_page()
            self.set_font("Helvetica", "B", 9)
            self.set_text_color(138, 235, 255)
            self.cell(col_w[0], 6, f" {label}", border=0)
            self.set_font("Helvetica", "", 9)
            self.set_text_color(180, 255, 180)
            self.cell(col_w[1], 6, val, border=0)
            self.set_text_color(180, 180, 180)
            self.cell(col_w[2], 6, note)
            self.ln()

    def sub_text(self, text):
        self.set_font("Helvetica", "", 9)
        self.set_text_color(160, 160, 160)
        self.multi_cell(0, 5, text)
        self.ln(2)


pdf = TechStackPDF()
pdf.alias_nb_pages()
pdf.set_auto_page_break(auto=True, margin=20)
pdf.add_page()

pdf.set_font("Helvetica", "B", 24)
pdf.set_text_color(255, 255, 255)
pdf.cell(0, 12, "Devi AI DevOps Platform", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.set_font("Helvetica", "", 11)
pdf.set_text_color(180, 180, 180)
pdf.cell(0, 8, "Complete Technology Stack & Project Overview", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.ln(6)

# ============================================================
# PROJECT OVERVIEW
# ============================================================
pdf.section_title("Project Overview")

pdf.set_font("Helvetica", "", 10)
pdf.set_text_color(220, 220, 220)
pdf.multi_cell(0, 6, "Devi is a production-grade, AI-powered DevOps dashboard and operating system. It provides a unified web interface to manage infrastructure through natural language commands, voice control, and traditional UI controls. The system combines real-time monitoring, container orchestration, Kubernetes management, CI/CD pipelines, and an intelligent AI agent into a single platform.")
pdf.ln(2)

pdf.set_font("Helvetica", "B", 10)
pdf.set_text_color(138, 235, 255)
pdf.cell(0, 6, "Core Features:", new_x="LMARGIN", new_y="NEXT")
pdf.set_font("Helvetica", "", 9)
pdf.set_text_color(200, 200, 200)
features = [
    "AI Agent - Natural language interface for infrastructure management (Jarvis-style)",
    "Docker Management - Monitor, create, start/stop/restart containers, build images",
    "Kubernetes Dashboard - Pod, node, deployment management with scaling & rollbacks",
    "CI/CD Pipeline - Track deployments, pipelines, history, and rollbacks",
    "Real-time Monitoring - CPU, memory, disk, network metrics with live WebSocket updates",
    "In-browser Terminal - Command execution with safety blocklist/allowlist controls",
    "Voice Assistant - Wake-word activated voice control using Web Speech API",
    "Activity Feed - Real-time infrastructure event stream",
    "Authentication - JWT with refresh tokens, role-based access (admin, operator, viewer)",
    "API Documentation - OpenAPI 3.0 / Swagger UI at /api/docs",
    "Anomaly Detection - AI agent detects CPU spikes, memory leaks, restart loops",
]
for f in features:
    pdf.cell(0, 5, f"  - {f}", new_x="LMARGIN", new_y="NEXT")
pdf.ln(2)

pdf.set_font("Helvetica", "B", 10)
pdf.set_text_color(138, 235, 255)
pdf.cell(0, 6, "Architecture:", new_x="LMARGIN", new_y="NEXT")
pdf.set_font("Helvetica", "", 9)
pdf.set_text_color(200, 200, 200)
pdf.multi_cell(0, 5, "The system follows a client-server architecture. The Next.js frontend communicates with the Express backend via REST APIs (axios) and WebSockets (socket.io). The backend orchestrates infrastructure through Docker Engine API (dockerode), Kubernetes API (@kubernetes/client-node), and system metrics (systeminformation). The AI agent processes natural language through a rule-based intent engine with session memory.")
pdf.ln(1)
pdf.multi_cell(0, 5, "Default Credentials: admin / admin123")
pdf.ln(1)
pdf.multi_cell(0, 5, "Project Structure: devi/ (Next.js frontend), devi/backend/ (Express API), devi-hero/ (Vite landing page), deploy/ (Docker Compose + Nginx + scripts)")
pdf.ln(4)

# ============================================================
pdf.section_title("1. Frontend - Next.js Application (devi/)")
pdf.tech_table([
    ("Next.js", "16.2.6", "App Router, React Server Components"),
    ("React", "19.2.4", "Client components with 'use client'"),
    ("TypeScript", "^5", "Strict mode, ES2017 target"),
    ("Tailwind CSS", "^4", "Utility-first CSS framework"),
    ("@tailwindcss/postcss", "^4", "Tailwind PostCSS plugin"),
    ("axios", "^1.16.1", "HTTP client, pre-configured interceptors"),
    ("framer-motion", "^12.39.0", "Page/component animations"),
    ("lucide-react", "^1.16.0", "SVG icon library"),
    ("recharts", "^3.8.1", "Charts for system metrics"),
    ("socket.io-client", "^4.8.3", "Real-time WebSocket client"),
    ("eslint", "^9", "Flat config linter"),
    ("eslint-config-next", "16.2.6", "Next.js ESLint rules"),
    ("@types/node", "^20", "Node type definitions"),
    ("@types/react", "^19", "React type definitions"),
    ("@types/react-dom", "^19", "ReactDOM type definitions"),
])
pdf.ln(2)

pdf.sub_text("Routes: / (home), /login, /dashboard, /agent, /chat, /docker, /kubernetes, /cicd, /monitoring, /terminal, /logs, /settings, /deploy")
pdf.sub_text("Components: ActivityFeed, AICore, AppShell, AuthGuard, BootScreen, GlassCard, HolographicCard, PageTransition, Particles, Sidebar, Toast, VoiceIndicator")
pdf.sub_text("Hooks: useVoiceAssistant (Web Speech API)")
pdf.sub_text("Library: api.ts (Axios), auth.tsx (JWT Context), socket.ts (Socket.io), utils.ts (cn, formatBytes, formatUptime)")
pdf.sub_text("Fonts: Geist (display), Inter (body), JetBrains Mono (code), Material Symbols (icons)")
pdf.ln(3)

# ============================================================
pdf.section_title("2. Backend - Express API Server (devi/backend/)")
pdf.tech_table([
    ("Node.js", "22-alpine", "Docker runtime base"),
    ("TypeScript", "^5.6", "ES2022 target, bundler resolution"),
    ("Express", "^4.21.0", "Web framework"),
    ("tsx", "^4.19.0", "TypeScript dev runner (watch mode)"),
    ("socket.io", "^4.8.0", "WebSocket server"),
    ("bcryptjs", "^3.0.3", "Password hashing (10 rounds)"),
    ("jsonwebtoken", "^9.0.3", "JWT auth (24h expiry)"),
    ("cors", "^2.8.5", "CORS with origin whitelist"),
    ("helmet", "^8.0.0", "Security headers"),
    ("morgan", "^1.10.0", "HTTP request logging"),
    ("express-rate-limit", "^8.5.2", "120 req/min rate limiting"),
    ("dockerode", "^5.0.0", "Docker Engine API client"),
    ("@kubernetes/client-node", "^1.4.0", "K8s API (pods, nodes, deployments)"),
    ("systeminformation", "^5.31.6", "System metrics (CPU, RAM, disk)"),
    ("swagger-jsdoc", "^6.2.8", "OpenAPI 3.0 spec generation"),
    ("swagger-ui-express", "^5.0.1", "Swagger UI at /api/docs"),
    ("tar", "^7.5.15", "Tar streams for Docker builds"),
    ("dotenv", "^16.4.5", "Environment config"),
])
pdf.ln(2)

pdf.sub_text("Services: system.ts, docker.ts, kubernetes.ts, auth.ts, ai.ts, agent.ts, parser.ts, shell.ts, safety.ts, memory.ts, logs.ts, cicd.ts")
pdf.sub_text("API Routes: /api/auth, /api/system, /api/docker, /api/kubernetes, /api/logs, /api/ai, /api/terminal, /api/cicd, /api/agent, /api/deploy")
pdf.sub_text("WebSocket Events: system:update, activity:new, logs:line, terminal:input/output, deployment:*")
pdf.sub_text("Middleware: helmet, cors, morgan, express.json, rate-limit, auth/requireAuth, auth/requireRole")
pdf.ln(3)

# ============================================================
pdf.section_title("3. Landing Page - Vite React (devi-hero/)")
pdf.tech_table([
    ("React", "^19.2.6", "UI library"),
    ("TypeScript", "~6.0.2", "Latest TypeScript"),
    ("Vite", "^8.0.12", "Build tool & dev server"),
    ("@vitejs/plugin-react", "^6.0.1", "React Fast Refresh"),
    ("@tailwindcss/vite", "^4.3.0", "Tailwind Vite plugin"),
    ("tailwindcss", "^4.3.0", "Utility-first CSS"),
    ("lucide-react", "^1.16.0", "SVG icons"),
    ("eslint", "^10.3.0", "Linter with flat config"),
    ("typescript-eslint", "^8.59.2", "TypeScript ESLint"),
])
pdf.ln(3)

# ============================================================
pdf.section_title("4. Design Assets (extracted/)")
pdf.sub_text("Deep Space HUD design system with cinematic glassmorphism theme.")
pdf.sub_text("Color: Dark (#020617), Cyan (#8aebff), Purple (#ddb7ff), Lime (#d9e70d)")
pdf.sub_text("Typography: Geist, Inter, JetBrains Mono | Layout: 12-col grid, 1440px max")
pdf.sub_text("Mockups: AI Assistant, DevOps Dashboard, Docker Management, Landing Page")
pdf.ln(3)

# ============================================================
pdf.section_title("5. Infrastructure & DevOps Tooling")
pdf.tech_table([
    ("Docker Compose", "v3.8", "Frontend + Backend orchestration"),
    ("Dockerfile", "multi-stage", "node:20-alpine with docker-cli"),
    ("Nginx", "reverse-proxy", "WebSocket support, gzip, rate limiting"),
    ("Deploy Scripts", "PowerShell", "deploy.ps1 lifecycle management"),
    ("Health Checks", "curl + Docker", "HEALTHCHECK on both services"),
    ("Networking", "bridge", "devi_net network, devi_data volume"),
    ("Ports", "3000 / 4000", "Frontend / Backend exposure"),
])
pdf.ln(3)

# ============================================================
pdf.section_title("6. Complete Technology Inventory (Alphabetical)")
pdf.set_font("Helvetica", "", 8)
col_w = [55, 35, 30, 70]
pdf.set_fill_color(20, 20, 40)
pdf.set_text_color(138, 235, 255)
pdf.set_font("Helvetica", "B", 8)
pdf.cell(col_w[0], 6, " Technology", border=0)
pdf.cell(col_w[1], 6, "Project", border=0)
pdf.cell(col_w[2], 6, "Version", border=0)
pdf.cell(col_w[3], 6, "Purpose")
pdf.ln()

all_techs = [
    ("@eslint/js", "devi-hero", "^10.0.1", "ESLint JS rules"),
    ("@kubernetes/client-node", "backend", "^1.4.0", "Kubernetes API client"),
    ("@tailwindcss/postcss", "devi", "^4", "Tailwind PostCSS plugin"),
    ("@tailwindcss/vite", "devi-hero", "^4.3.0", "Tailwind Vite plugin"),
    ("@vitejs/plugin-react", "devi-hero", "^6.0.1", "React Fast Refresh"),
    ("axios", "devi", "^1.16.1", "HTTP client"),
    ("bcryptjs", "backend", "^3.0.3", "Password hashing"),
    ("cors", "backend", "^2.8.5", "CORS middleware"),
    ("dockerode", "backend", "^5.0.0", "Docker Engine API"),
    ("dotenv", "backend", "^16.4.5", "Environment config"),
    ("eslint", "devi", "^9", "Linter"),
    ("eslint", "devi-hero", "^10.3.0", "Linter"),
    ("eslint-config-next", "devi", "16.2.6", "Next.js ESLint rules"),
    ("eslint-plugin-react-hooks", "devi-hero", "^7.1.1", "React Hooks rules"),
    ("eslint-plugin-react-refresh", "devi-hero", "^0.5.2", "React Refresh rules"),
    ("express", "backend", "^4.21.0", "Web framework"),
    ("express-rate-limit", "backend", "^8.5.2", "Rate limiting"),
    ("framer-motion", "devi", "^12.39.0", "Animations"),
    ("globals", "devi-hero", "^17.6.0", "ESLint globals"),
    ("helmet", "backend", "^8.0.0", "Security headers"),
    ("jsonwebtoken", "backend", "^9.0.3", "JWT auth"),
    ("lucide-react", "devi", "^1.16.0", "Icons"),
    ("lucide-react", "devi-hero", "^1.16.0", "Icons"),
    ("morgan", "backend", "^1.10.0", "Request logging"),
    ("next", "devi", "16.2.6", "React framework"),
    ("react", "devi", "19.2.4", "UI library"),
    ("react", "devi-hero", "^19.2.6", "UI library"),
    ("react-dom", "devi", "19.2.4", "React DOM"),
    ("react-dom", "devi-hero", "^19.2.6", "React DOM"),
    ("recharts", "devi", "^3.8.1", "Charting"),
    ("socket.io", "backend", "^4.8.0", "WebSocket server"),
    ("socket.io-client", "devi", "^4.8.3", "WebSocket client"),
    ("swagger-jsdoc", "backend", "^6.2.8", "OpenAPI spec"),
    ("swagger-ui-express", "backend", "^5.0.1", "API docs UI"),
    ("systeminformation", "backend", "^5.31.6", "System metrics"),
    ("tailwindcss", "devi", "^4", "CSS framework"),
    ("tailwindcss", "devi-hero", "^4.3.0", "CSS framework"),
    ("tar", "backend", "^7.5.15", "Tar streams"),
    ("tsx", "backend", "^4.19.0", "TS dev runner"),
    ("typescript", "devi", "^5", "Type system"),
    ("typescript", "backend", "^5.6.0", "Type system"),
    ("typescript", "devi-hero", "~6.0.2", "Type system"),
    ("typescript-eslint", "devi-hero", "^8.59.2", "TS ESLint"),
    ("vite", "devi-hero", "^8.0.12", "Build tool"),
]

for tech, proj, ver, purp in all_techs:
    if pdf.get_y() > 255:
        pdf.add_page()
        pdf.set_fill_color(20, 20, 40)
        pdf.set_text_color(138, 235, 255)
        pdf.set_font("Helvetica", "B", 8)
        pdf.cell(col_w[0], 6, " Technology", border=0)
        pdf.cell(col_w[1], 6, "Project", border=0)
        pdf.cell(col_w[2], 6, "Version", border=0)
        pdf.cell(col_w[3], 6, "Purpose")
        pdf.ln()
    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(200, 200, 200)
    pdf.cell(col_w[0], 5, f" {tech}", border=0)
    pdf.set_text_color(180, 255, 180)
    pdf.cell(col_w[1], 5, proj, border=0)
    pdf.set_text_color(180, 180, 180)
    pdf.cell(col_w[2], 5, ver, border=0)
    pdf.set_text_color(160, 160, 160)
    pdf.cell(col_w[3], 5, purp)
    pdf.ln()

pdf.ln(4)

# ============================================================
pdf.section_title("7. Non-Package Technologies")
pdf.set_font("Helvetica", "", 9)
non_pkg = [
    ("Web Speech API", "devi frontend", "Voice assistant (wake word, STT)"),
    ("Docker CLI (dockerode)", "backend", "Container management"),
    ("Kubernetes (kubeconfig)", "backend", "Cluster management"),
    ("Nginx", "deploy/", "Reverse proxy, WebSocket, gzip"),
    ("OpenAPI 3.0 / Swagger", "backend", "API documentation"),
    ("Docker Compose v3.8", "root", "Service orchestration"),
    ("PowerShell / Batch", "deploy/", "Deployment scripts"),
    ("Google Fonts", "devi", "Geist, Inter, JetBrains Mono"),
    ("CSS Animations", "devi", "shimmer, pulse, float, scan"),
]
col2 = [55, 45, 90]
pdf.set_fill_color(20, 20, 40)
pdf.set_text_color(138, 235, 255)
pdf.set_font("Helvetica", "B", 9)
pdf.cell(col2[0], 6, " Technology", border=0)
pdf.cell(col2[1], 6, "Project", border=0)
pdf.cell(col2[2], 6, "Purpose")
pdf.ln()
for tech, proj, purp in non_pkg:
    if pdf.get_y() > 260:
        pdf.add_page()
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(200, 200, 200)
    pdf.cell(col2[0], 5, f" {tech}", border=0)
    pdf.set_text_color(180, 255, 180)
    pdf.cell(col2[1], 5, proj, border=0)
    pdf.set_text_color(160, 160, 160)
    pdf.cell(col2[2], 5, purp)
    pdf.ln()

pdf.ln(6)
pdf.set_font("Helvetica", "I", 9)
pdf.set_text_color(100, 100, 100)
pdf.cell(0, 6, "Generated: June 2026", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.cell(0, 6, "Devi AI - AI-Powered DevOps Infrastructure", align="C")

output_path = "D:\\devops ai assi\\Devi_Tech_Stack_Summary.pdf"
pdf.output(output_path)
print(f"PDF generated: {output_path}")
