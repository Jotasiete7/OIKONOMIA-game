@echo off
chcp 65001 > nul
title OIKONOMIA - Servidor Dev (Vite)
echo ==============================================================================
echo               OIKONOMIA -- SERVIDOR DE DESENVOLVIMENTO (Vite)
echo ==============================================================================
echo.
echo Iniciando servidor em http://localhost:5173 com HMR ativo...
echo Pressione Ctrl+C para encerrar o servidor.
echo.
npm run dev
