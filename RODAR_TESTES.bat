@echo off
chcp 65001 > nul
title OIKONOMIA - Bateria de Testes Matematicos
echo ==============================================================================
echo        OIKONOMIA -- EXECUTANDO BATERIA DE TESTES DO SIM-CORE OFICIAL
echo ==============================================================================
echo.
set ELECTRON_RUN_AS_NODE=1
"%LOCALAPPDATA%\Programs\antigravity\Antigravity.exe" --experimental-strip-types "%~dp0core\tests\math.test.ts"
echo.
echo ==============================================================================
pause
