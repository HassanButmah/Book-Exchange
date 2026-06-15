@echo off
echo.
echo ========================================
echo   HU Book Exchange - Quick Start
echo ========================================
echo.

echo Checking for Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✓ Node.js found
echo.

echo Checking for PostgreSQL...
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: PostgreSQL is not installed!
    echo Download from: https://www.postgresql.org/download/windows/
    pause
    exit /b 1
)

echo ✓ PostgreSQL found
echo.

echo ========================================
echo   Installing Backend Dependencies...
echo ========================================
cd server
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
cd ..

echo.
echo ========================================
echo   Backend Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Start PostgreSQL service
echo 2. Run: npm start (in server folder)
echo 3. In frontend folder: python -m http.server 3000
echo 4. Open http://localhost:3000
echo.
echo Demo Account:
echo   Email: demo@students.hebron.edu
echo   Password: password123
echo.
pause
