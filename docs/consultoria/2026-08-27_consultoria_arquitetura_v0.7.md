# OIKONOMIA -- Consultoria Senior de Arquitetura
Data: 2026-08-27 | Versao: v0.7.0 (Build 2026)
Engine: HTML5 Canvas + Vanilla JS | Mapa: 128x128

## 1. Arquitetura Atual
Monolito HTML/JS de ~5.850 linhas (client/index.html). Toda a logica do motor de simulacao, estado global, renderizador isometrico e UI coexistem num unico script. O core/ existe como TypeScript puro mas nao e consumido pelo client, gerando duplicacao silenciosa. worldGrid: 16.384 objetos mutablemente na memoria. Loop de simulacao via setInterval, percorrendo O(n2) tiles por tick.

## 2. Red Flags Criticos

### CRITICO 1 — Loop O(n2) por Tick
simulateDay() percorre 16.384 tiles a cada tick. Em 5x (80ms): mais de 200.000 iteracoes/segundo na thread principal. 99% sobre tiles vazios.

### CRITICO 2 — Estado Global Mutavel
~40+ variaveis globais soltas. cash modificado em 12+ lugares sem trace. Impossivel fazer time-travel debug ou Undo/Redo.

### CRITICO 3 — Monolito de 5.850 linhas
Sem modulos, sem import/export, sem bundler. Qualquer bug afeta tudo.

### ALTO — Duplicacao core/ vs client/
core/ tem funcoes TS testadas (calcProductRating, calcElasticity, etc.) que nao sao usadas. client/ reimplementa tudo inline, divergindo em comportamento.

### ALTO — renderMap() sem requestAnimationFrame
Redesenha o Canvas em cada hover, clique, tick e modal. Sem dirty flag nem rAF.

### MEDIO — map_data.js de 173KB bloqueante no head
Carregado de forma sincrona antes do primeiro paint.

### MEDIO — Saves sem versionamento de esquema
saveVersion: 0.7.0 mas sem logica de migracao para versoes futuras.

## 3. Plano de Acao (por prioridade)

| # | Acao | Impacto | Prioridade |
|---|------|---------|-----------|
| 1 | Sparse Index (Set de tiles ativos) | Performance critica | IMEDIATA |
| 2 | requestAnimationFrame + dirty flag | Fluidez visual | IMEDIATA |
| 3 | GameState object centralizado | Manutenibilidade | Curto prazo |
| 4 | Integrar core/ no client | Consistencia | Curto prazo |
| 5 | Separar HTML em arquivos JS | Modularidade | Curto prazo |
| 6 | Cache _cityId por tile | Performance leve | Medio prazo |
| 7 | Migracao de esquema de saves | Robustez | Medio prazo |
| 8 | map_data.js com defer + binario | Carregamento | Medio prazo |
| 9 | Web Worker para simulacao | Futuro AA/AAA | Longo prazo |

## 4. Snapshot do Projeto
- client/index.html: 265.412 bytes / 5.852 linhas
- map_data.js: 176.743 bytes / 661 linhas
- core/: 7 modulos TS de matematica economica (nao integrados)
- Saves: localStorage multi-slot com exportacao .oiko
- Produtos: 70+ no catalogo
- Cidades: 4 (Nova Atenas, Porto Real, Montargis, Varzea)