@echo off
:: ============================================================
:: Instala el print-server de Fluxo para que inicie
:: automáticamente con Windows (sin ventana visible)
:: Ejecutar UNA SOLA VEZ en la PC de la impresora
:: ============================================================

set SCRIPT_DIR=%~dp0
set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set VBS_FILE=%STARTUP_DIR%\FluxoPrintServer.vbs

:: Crear el VBScript que ejecuta el BAT sin ventana
:: Usa la ruta ABSOLUTA de donde está ahora la carpeta
echo Set WshShell = CreateObject("WScript.Shell") > "%VBS_FILE%"
echo WshShell.Run "cmd /c cd /d ""%SCRIPT_DIR%"" && node server.cjs", 0 >> "%VBS_FILE%"
echo Set WshShell = Nothing >> "%VBS_FILE%"

echo.
echo ============================================
echo   LISTO! El print server de Fluxo se
echo   iniciara automaticamente cada vez que
echo   prendas esta PC.
echo.
echo   Ubicacion del server:
echo   %SCRIPT_DIR%
echo.
echo   Para DESACTIVAR el auto-inicio, elimina:
echo   %VBS_FILE%
echo ============================================
echo.
pause
