# Devi — AI DevOps Operating System

A production-grade AI-powered DevOps dashboard with voice-controlled infrastructure automation.

## Features

- **AI Agent** — Natural language interface for infrastructure management
- **Docker Management** — Monitor and control containers
- **Kubernetes Dashboard** — Pod, node, and deployment management
- **CI/CD Pipeline** — Track deployments and rollbacks
- **Real-time Monitoring** — System metrics with live updates
- **Terminal** — In-browser command execution with safety controls
- **Voice Assistant** — Wake-word activated voice control
- **Activity Feed** — Real-time infrastructure event stream

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Framer Motion, Recharts
- **Backend:** Express, Socket.io, Dockerode, systeminformation
- **Auth:** JWT with refresh tokens, bcrypt

## Quick Start

```bash
# Frontend
cd devi
npm install
npm run dev

# Backend (separate terminal)
cd devi/backend
npm install
npm run dev
```

## Default Credentials

- Username: `admin`
- Password: `admin123`

## Project Structure

```
devi/
├── src/               # Next.js frontend
│   ├── app/           # Pages (dashboard, chat, docker, k8s, etc.)
│   ├── components/    # UI components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # API client, socket, auth, utils
│   └── types/         # TypeScript type definitions
├── backend/           # Express API server
│   └── src/
│       ├── routes/    # REST API routes
│       ├── services/  # Business logic
│       ├── middleware/ # Auth middleware
│       ├── socket/    # WebSocket handlers
│       └── data/      # Mock data generators
├── deploy/            # Deployment configs
└── docker-compose.yml # Container orchestration
```

## License

MIT
