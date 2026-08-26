@echo off
chcp 65001 > nul
title OIKONOMIA - Jogo Oficial
echo ==============================================================================
echo                 OIKONOMIA -- INICIANDO O JOGO NO NAVEGADOR
echo ==============================================================================
echo.
start "" "%~dp0client\index.html"
exit
