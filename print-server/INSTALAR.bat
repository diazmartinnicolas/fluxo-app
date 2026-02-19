@echo off
echo ========================================
echo   INSTALADOR FLUXO PRINT SERVER
echo ========================================
echo.
echo Este programa instalara el servidor de impresion en el inicio de Windows.
echo.
echo Presione cualquier tecla para continuar...
pause >nul

cd /d "%~dp0"

if not exist FluxoPrintServer.exe (
    echo [ERROR] No se encuentra FluxoPrintServer.exe
    echo Por favor asegurese de copiar todos los archivos.
    pause
    exit /b 1
)

start "" FluxoPrintServer.exe --install
