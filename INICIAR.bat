@echo off
echo.
echo ========================================
echo    EventoAI - Iniciando...
echo ========================================
echo.

python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python no esta instalado.
    echo Descargalo de: https://www.python.org/downloads/
    echo IMPORTANTE: Tilda "Add Python to PATH" al instalar.
    pause
    exit /b 1
)

node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js no esta instalado.
    echo Descargalo de: https://nodejs.org/
    pause
    exit /b 1
)

echo Python y Node.js encontrados. Continuando...
echo.

cd /d "%~dp0backend"

if not exist "venv" (
    echo Creando entorno virtual de Python...
    python -m venv venv
)

echo Activando entorno virtual...
call venv\Scripts\activate.bat

echo Instalando dependencias del backend...
pip install -r requirements.txt -q
echo Dependencias instaladas.
echo.

echo Iniciando servidor backend...
start "EventoAI Backend" cmd /k "cd /d "%~dp0backend" && call venv\Scripts\activate.bat && uvicorn main:app --reload"

echo Esperando que el backend inicie...
timeout /t 5 /nobreak >nul

cd /d "%~dp0frontend"

if not exist "node_modules" (
    echo Instalando dependencias del frontend...
    npm install
) else (
    echo Dependencias del frontend ya instaladas.
)

echo.
echo Iniciando frontend...
start "EventoAI Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

timeout /t 4 /nobreak >nul
start http://localhost:3000

echo.
echo ========================================
echo  EventoAI iniciado!
echo  Abre: http://localhost:3000
echo ========================================
echo.
pause
