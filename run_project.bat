@echo off
echo Starting Attendance Gigs Project...

:: Start Backend
echo Starting Backend Server...
start cmd /k "npm run dev"

:: Start Frontend
echo Starting Frontend Development Server...
cd frontend
start cmd /k "npm run dev"

echo.
echo Both servers are starting up in separate windows.
echo Backend will be available at http://localhost:3000 (check server.js for port)
echo Frontend will be available at http://localhost:5173 (Vite default)
echo.
pause
