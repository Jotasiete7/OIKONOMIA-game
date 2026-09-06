@echo off
chcp 65001 > nul
title OIKONOMIA - Jogo Oficial
echo ==============================================================================
echo                 OIKONOMIA -- INICIANDO O JOGO NO NAVEGADOR
echo ==============================================================================
echo.
if not exist "%~dp0dist\index.html" (
    if exist "D:\Program Files\nodejs" set PATH=D:\Program Files\nodejs;%PATH%
    if exist "C:\Program Files\nodejs" set PATH=C:\Program Files\nodejs;%PATH%
    if not exist "%~dp0node_modules" (
        echo [INFO] Instalando dependencias necessarias pela primeira vez...
        call npm install
    )
    echo [INFO] Gerando build de producao com Vite...
    call npm run build
)
start "" "%~dp0dist\index.html"
exit
