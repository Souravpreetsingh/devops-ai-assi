# Stage 1: Build frontend (Next.js)
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm ci && npm cache clean --force
COPY tsconfig.json tsconfig.json ./
COPY next.config.* ./
COPY src/ src/
COPY public/ public/
RUN npm run build

# Stage 2: Build backend
FROM node:20-alpine AS backend-build
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci && npm cache clean --force
COPY backend/tsconfig.json ./
COPY backend/src/ src/
RUN npm run build

# Stage 3: Production image
FROM node:20-alpine AS production
WORKDIR /app

RUN apk add --no-cache curl docker-cli

# Copy backend
COPY --from=backend-build /app/dist ./backend/dist
COPY --from=backend-build /app/node_modules ./backend/node_modules
COPY --from=backend-build /app/package.json ./backend/

# Copy frontend
COPY --from=frontend-build /app/.next ./frontend/.next
COPY --from=frontend-build /app/node_modules ./frontend/node_modules
COPY --from=frontend-build /app/package.json ./frontend/
COPY --from=frontend-build /app/public ./frontend/public
COPY --from=frontend-build /app/next.config.* ./frontend/

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:4000/api/health || exit 1

CMD ["node", "backend/dist/index.js"]
