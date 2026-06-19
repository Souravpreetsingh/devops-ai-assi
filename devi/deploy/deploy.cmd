@echo off
REM Devi Deployment Script for Windows (PowerShell)
echo %0 | powershell -Command "& { $script = Get-Content -LiteralPath '%0' -Raw; Invoke-Expression $script }"
exit /b
