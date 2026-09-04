@echo off
chcp 65001 > nul
title OIKONOMIA - Jogo Oficial
echo ==============================================================================
echo                 OIKONOMIA -- INICIANDO O JOGO NO NAVEGADOR
echo ==============================================================================
echo.
if not exist "%~dp0dist\index.html" (
    echo [INFO] Pasta dist nao encontrada. Gerando build de producao...
    if exist "D:\Program Files\nodejs" set PATH=D:\Program Files\nodejs;%PATH%
    if exist "C:\Program Files\nodejs" set PATH=C:\Program Files\nodejs;%PATH%
    call npm run build
)
start "" "%~dp0dist\index.html"
exit
