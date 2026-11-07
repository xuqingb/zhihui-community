@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Please install Node.js 22.12 or newer first.
  pause
  exit /b 1
)
if not exist "node_modules\vite\package.json" (
  call npm.cmd ci --cache "..\.npm-cache" --no-audit --no-fund
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
echo ZhiHui frontend: http://127.0.0.1:5173/
echo Press Ctrl+C to stop.
call npm.cmd run dev -- --open
pause
