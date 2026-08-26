@echo off
chcp 65001 > nul
title OIKONOMIA - Benchmark de Simulacao no Console
echo ==============================================================================
echo        OIKONOMIA -- EXECUTANDO BENCHMARK DO MOTOR ECONOMICO (CLI)
echo ==============================================================================
echo.
set ELECTRON_RUN_AS_NODE=1
"%LOCALAPPDATA%\Programs\antigravity\Antigravity.exe" --experimental-strip-types "%~dp0tools\runBenchmark.ts"
echo.
echo ==============================================================================
pause
