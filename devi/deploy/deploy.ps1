#!/usr/bin/env pwsh
# Devi Deployment Script
# Usage: ./deploy.ps1 [command]

param(
    [Parameter(Position=0)]
    [ValidateSet("build", "up", "down", "restart", "logs", "clean")]
    [string]$Command = "up"
)

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$PROJECT_DIR = Split-Path -Parent $SCRIPT_DIR
$COMPOSE_FILE = Join-Path $PROJECT_DIR "docker-compose.yml"

function Write-Header {
    Write-Host "`n  ╔══════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "  ║     Devi Deployment Script       ║" -ForegroundColor Cyan
    Write-Host "  ╚══════════════════════════════════╝`n" -ForegroundColor Cyan
}

switch ($Command) {
    "build" {
        Write-Header
        Write-Host "→ Building Docker images..." -ForegroundColor Yellow
        Set-Location $PROJECT_DIR
        docker compose -f $COMPOSE_FILE build --no-cache
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Build complete" -ForegroundColor Green
        } else {
            Write-Host "✗ Build failed" -ForegroundColor Red
            exit 1
        }
    }
    "up" {
        Write-Header
        Write-Host "→ Starting Devi platform..." -ForegroundColor Yellow
        Set-Location $PROJECT_DIR
        docker compose -f $COMPOSE_FILE up -d
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Devi is running!" -ForegroundColor Green
            Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Cyan
            Write-Host "  Backend:  http://localhost:4000/api" -ForegroundColor Cyan
            Write-Host "  Docs:     http://localhost:4000/api/docs" -ForegroundColor Cyan
        }
    }
    "down" {
        Write-Header
        Write-Host "→ Stopping Devi platform..." -ForegroundColor Yellow
        Set-Location $PROJECT_DIR
        docker compose -f $COMPOSE_FILE down
        Write-Host "✓ Stopped" -ForegroundColor Green
    }
    "restart" {
        Write-Header
        Write-Host "→ Restarting Devi platform..." -ForegroundColor Yellow
        Set-Location $PROJECT_DIR
        docker compose -f $COMPOSE_FILE restart
        Write-Host "✓ Restarted" -ForegroundColor Green
    }
    "logs" {
        Set-Location $PROJECT_DIR
        docker compose -f $COMPOSE_FILE logs -f
    }
    "clean" {
        Write-Header
        Write-Host "→ Cleaning up..." -ForegroundColor Yellow
        Set-Location $PROJECT_DIR
        docker compose -f $COMPOSE_FILE down -v
        docker system prune -f --volumes
        Write-Host "✓ Cleaned" -ForegroundColor Green
    }
}
