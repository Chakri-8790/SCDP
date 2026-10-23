#!/usr/bin/env pwsh
# SmartConstruct AI — Start all services
# Usage: .\start.ps1

$base = $PSScriptRoot

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   SmartConstruct AI — Starting Services   " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
try {
    $nodeVersion = node --version 2>&1
    Write-Host "[OK] Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js not found. Install from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "[OK] Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "[WARN] Python not found. ML service will use mock mode." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Starting services in separate windows..." -ForegroundColor Yellow
Write-Host ""

# Start MongoDB (if mongod is available)
$mongodPath = Get-Command mongod -ErrorAction SilentlyContinue
if ($mongodPath) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'MongoDB' -ForegroundColor Green; mongod"
    Write-Host "[STARTED] MongoDB" -ForegroundColor Green
    Start-Sleep -Seconds 2
} else {
    Write-Host "[SKIP] mongod not in PATH — ensure MongoDB is running manually" -ForegroundColor Yellow
}

# Start ML Service
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "Set-Location '$base\ml-service'; Write-Host 'ML Service (port 8000)' -ForegroundColor Cyan; python app.py"
Write-Host "[STARTED] ML Service on port 8000" -ForegroundColor Green
Start-Sleep -Seconds 1

# Start Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "Set-Location '$base\server'; Write-Host 'Backend API (port 5000)' -ForegroundColor Blue; npm run dev"
Write-Host "[STARTED] Backend API on port 5000" -ForegroundColor Green
Start-Sleep -Seconds 1

# Start Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "Set-Location '$base\client'; Write-Host 'React Frontend (port 3000)' -ForegroundColor Magenta; npm run dev"
Write-Host "[STARTED] React Frontend on port 3000" -ForegroundColor Green

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " All services started in separate windows  " -ForegroundColor Cyan
Write-Host " Open: http://localhost:3000               " -ForegroundColor White
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
