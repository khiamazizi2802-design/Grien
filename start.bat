@echo off
echo ===================================================
echo     KHIAM GRIEN - MULTI-PLATFORM ECOSYSTEM
echo ===================================================
echo.

echo [1/4] Starting Khiam Grien Backend Server (Port 3001)...
start "Khiam Grien Backend" cmd /k "cd /d "%~dp0server" && npm.cmd start"

echo [2/4] Starting Khiam Grien Customer App (Port 5173)...
start "Khiam Grien - Kunden App" cmd /k "cd /d "%~dp0client" && npm.cmd run dev"

echo [3/4] Starting Khiam Grien Manager Web Portal (Port 5174)...
start "Khiam Grien - Manager Portal" cmd /k "cd /d "%~dp0admin-portal" && npm.cmd run dev"

echo [4/4] Starting DGrien Driver and Fleet App (Port 5175)...
start "DGrien - Driver and Fleet" cmd /k "cd /d "%~dp0dgrien-app" && npm.cmd run dev"

echo.
echo All 4 services are starting!
echo - Customer App:     http://localhost:5173
echo - Manager Website:  http://localhost:5174
echo - DGrien App:       http://localhost:5175
echo - Backend API:      http://localhost:3001
echo.
