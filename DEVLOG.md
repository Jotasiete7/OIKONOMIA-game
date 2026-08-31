# 🏛️ OIKONOMIA — Diário dos Desenvolvedores (DevLog & Agenda Técnica)

> **Documento Oficial de Rastreabilidade, Versionamento e Evolução do Projeto**  
> **Repositório:** `Jotasiete7/OIKONOMIA-game`  
> **Última Atualização:** 31 de Agosto de 2026  
> **Versão Oficial Corrente:** `v0.8.3 (bld.20260831.02)`  
> **Save Schema:** `v0.8.2` (Compatibilidade Retroativa Total com Migrações)

---

## 🏷️ Padrão Oficial de Versionamento da Equipe (SemVer 2.0 + Build Stamp)

Todo o projeto segue estritamente a convenção:
$$\mathbf{vMAJOR}.\mathbf{MINOR}.\mathbf{PATCH}+\mathbf{bld.YYYYMMDD.XX}$$

- **MAJOR (v1.0.0, v2.0.0)**: Marcos definitivos de lançamento comercial / saída de Beta.
- **MINOR (v0.7.x -> v0.8.0 -> v0.9.0)**: Grandes módulos ou mecânicas novas (ex: P&D, QG Corporativo, frotas visuais).
- **PATCH (v0.8.1 -> v0.8.2 -> v0.8.3)**: Pacotes de usabilidade, balanceamento, sprites, tutorial, IA e refinamentos de UI.
- **BUILD STAMP (`bld.YYYYMMDD.XX`)**: Carimbo diário com a data e o número da entrega daquele dia.
- **SAVE SCHEMA (`0.8.2`)**: Controla a compatibilidade dos saves `.oiko` e do `localStorage`.

---

## 🧭 Agenda de Desenvolvimento (Ideias & Backlog em Standby)

- [ ] **Fase 3 Causalidade — Botão "Por quê?" & DRE Drill-Down**: Decomposição em árvore dos fatores de preço, atratividade e custos.
- [ ] **Fase 4 Narrativa — Diário Econômico Procedural**: Manchetes de jornal geradas dinamicamente pelo TimeSeriesBuffer.
- [ ] **QG Corporativo & Diretoria Executiva (v0.9.0)**: Sede global única com contratação de executivos (CEO, COO, CMO, CTO, CFO) com bônus setoriais de margem e pesquisa.
- [ ] **IA Concorrente com P&D Dinâmico**: Concorrentes evoluindo tecnologia mensalmente, solicitando patentes exclusivas e reagindo ao avanço do jogador.
- [ ] **Módulo de Logística Visual**: Frotas de caminhões e navios com animação isométrica navegando pelas rodovias e rotas marítimas entre portos e cidades.
- [ ] **Bolsa de Valores & Empréstimos Bancários**: Sistema financeiro para emissão de debêntures, IPO corporativo, empréstimos e recompra de ações.
- [ ] **Polimento Gráfico & Efeitos Isométricos**: Sombras dinâmicas calculadas por altura de edifício e transições de iluminação.

---

## 📜 Histórico de Sessões & Registros de Evolução

---

### 📅 Sessão 10: Fundação de Séries Temporais (`TimeSeriesBuffer`), Diagnóstico Econômico & Quick Wins de Causalidade
- **Data:** 31/08/2026 — 19:15
- **Versão Oficial:** `v0.8.3 (bld.20260831.02)` | **Save Schema:** `v0.8.2`
- **Autor / Pair Programming:** Jotasiete & Antigravity (AI Assistant)

#### 🎯 Entregas da Sessão:
1. **Fundação de Séries Temporais (`TimeSeriesBuffer` de 24 Meses):**
   - Implementado buffer circular permanente em `GameState.historicalLedger` registrando a cada fechamento mensal (`closeMonthEnd`):
     - Receita, CPV, Despesas Fixas, Marketing, Juros Financeiros, Lucro Líquido, Caixa e Patrimônio Líquido.
     - Snapshot discriminado por instalação ativa (lojas, fábricas, fazendas, minas, P&D).
   - Sanitização e migração retroativa em `migrateSaveData` e persistência total no formato de save `.oiko`.
2. **Auditoria Financeira DRE com Gráficos Sparklines & Analista Corporativo:**
   - Gráfico de barras verticais compactas de evolução histórica exibindo barras azuis (receita) e verdes/rosas (lucro/prejuízo) dos últimos meses.
   - Card inteligente do **Analista Corporativo** gerando diagnósticos determinísticos de variância mês a mês (apontando filiais destaque e pontos de prejuízo).
3. **Lente de Oportunidade de Mercado (`🎯 Oportunidade`):**
   - Nova lente integrada no dropdown da Top Bar unificada.
   - Heatmap de potencial de investimento baseado no índice $I = (População \times Tráfego) / (1 + Concorrência)$, colorindo em esmeralda neon os lotes com alta demanda e baixa concorrência.
4. **Gestão de Estoque como Capital de Giro:**
   - Cálculo e exibição em tempo real de **Dias de Cobertura de Estoque** nas gôndolas com badges semânticos (`🔴 Ruptura`, `🔴 Risco`, `🟡 Médio`, `🟢 Seguro`).
   - Exibição de **Capital Imobilizado ($)** em cada prateleira e silo.
5. **Calculadora de Payback & ROI no Wizard de Construção:**
   - Estimativa matemática de retorno de investimento (meses para payback e ROI anualizado) em lojas comerciais, fazendas e minas baseada na densidade demográfica local.
6. **Simulador "E se?" (Sandbox de Precificação):**
   - Modal interativo `#price-simulator-modal` com slider de preço de venda projetando em tempo real: vendas diárias estimadas, receita diária, margem bruta (%) e lucro operacional mensal projetado antes de confirmar a alteração no jogo real.
7. **Suprimento & Cadeia Agropecuária (Ovos e Ração):**
   - Correção do botão `Encher` para drenar primeiro o silo de granjas/fábricas próprias a Custo \$0 e comprar apenas o saldo importado.
   - Ativação universal do módulo de Nutrição & Ração Pecuária na Granja Avícola (+50% rendimento com Milho/Trigo).

---

### 📅 Sessão 09: Logo Procedural de Empresa, Consolidação da UI Superior & Persistência de Bancadas de P&D
- **Data:** 31/08/2026 — 01:15 (Fechamento de Expediente)
- **Versão Oficial:** `v0.8.2 (bld.20260831.01)` | **Save Schema:** `v0.8.1`
- **Autor / Pair Programming:** Jotasiete & Antigravity (AI Assistant)

#### 🎯 Entregas da Sessão:
1. **Sistema de Logo Procedural Determinístico (Identicons):**
   - Implementação de `hashStringToSeed(companyName + regenSeed)` e `generateCompanyLogo()`.
   - 10 ícones editoriais em SVG fino e 3 formas geométricas (`circle`, `shield`, `hexagon`).
   - Paleta dourada travada para o jogador (`#d4b483`, `#c9a86a`, `#e0c28f`, `#b8935f`) e paleta avermelhada para IAs concorrentes (`#c0392b`, `#e74c3c`, `#d35400`, `#a93226`).
   - Substituição de todos os rótulos de texto permanentes (`PORTO`, `FAZENDA`, `FÁBRICA`, `MÍDIA`) por badges de logo nos topos dos edifícios.
   - Preview dinâmico no Wizard de Nova Empresa com botão `🔀 Gerar outro` (+1 seed) e persistência de `logoRegenSeed` em saves `.oiko`.
2. **Consolidação & Limpeza da UI Superior:**
   - Remoção da barra secundária flutuante de lentes (`#floating-lenses-bar`).
   - Top Header unificado de linha única com dropdown compacto de Lentes (`🌐 Terreno ▾`) e menu agrupador `⋯ Mais` (Wiki, Tutorial, Diário, Tech Tree).
   - Destaque dourado `#d4b483` com glow no tile selecionado e tooltip de hover dinâmico com badge SVG e resumo socioeconômico.
3. **Persistência & Visualização Viva das Bancadas de P&D:**
   - `renderRDCenterPanel` reformulado para exibir cards individuais com barra de progresso do QR, status em tempo real, verba mensal e botões de controle (`⏸ Pausar`, `💰 Verba`, `✕ Cancelar`).
   - Auto-refresh instantâneo da janela do lote ao criar, pausar, retomar ou avançar pesquisas mensalmente.
   - Sincronização direta dos badges de P&D nas linhas de produção e prateleiras comerciais.
4. **Suíte de Testes Automatizados E2E:**
   - 27 testes automatizados cobrindo determinismo algorítmico, SVG, persistência de saves, integridade de componentes de UI e renderização isométrica (100% de aprovação).

---

### 📅 Sessão 08: Refinamento da Malha Viária, Nova Arte de Florestas, Modal In-Game & Auditoria de Camadas
- **Data:** 28/08/2026 — 23:30 (Fechamento de Expediente)
- **Versão Oficial:** `v0.8.1 (bld.20260828.03)` | **Save Schema:** `v0.8.1`
- **Autor / Pair Programming:** Jotasiete & Antigravity (AI Assistant)

#### 🎯 Entregas da Sessão:
1. **Limpeza & Polimento da Malha Viária:**
   - Remoção de todos os cortes transversais e dentes de serra pelo maciço central de montanhas.
   - Eliminação de todas as vias que avançavam sobre o mar aberto (zero asfalto na água).
   - Consolidação do Anel Rodoviário Periférico com faixas amarelas contínuas nos eixos X e Y.
2. **Nova Arte de Cruzamentos de Vias (`road_intersection.png`):**
   - Criação de sprite com faixas contínuas conectadas no centro do cruzamento em $64 \times 64$ px.
3. **Modal Customizado In-Game de Venda & Demolição:**
   - Substituição do `window.confirm()` nativo do navegador pelo `#confirm-facility-modal` em tema escuro Tailwind com discriminação financeira de estoques, sucata e propostas de IA concorrente.
4. **Arte Oficial de Florestas (3 Árvores Isométricas):**
   - Criação de sprite pixel art com 3 árvores isométricas em camadas e sombras projetadas (`terrenos/forest.png`).
   - Alinhamento de ancoragem geométrica precisa (`Y=32..64`), eliminando o desnível em relação a solos vizinhos.
5. **Auditoria & Organização das 5 Camadas do Mapa:**
   - Transferência automática de 47 blocos de vias, 22 de areia e 16 de água para suas camadas canônicas.
   - Sincronização 100% fiel e bidirecional entre `data/maps/oikonomia_map.tmx` e `client/map_data.js`.
6. **Alinhamento de Costa Urbana:**
   - Expansão de terra firme e orla de praia sob todos os 4 quarteirões de Nova Atenas e Porto Real, eliminando sobreposições de água sob as cidades.

---

### 📅 Sessão 07: Pacote Completo de Usabilidade, Sprites Isométricos, Tutorial do Magnata, Multilinhas de Fábrica & IA Comercial
- **Data:** 28/08/2026 — 13:00
- **Versão Oficial:** `v0.8.1 (bld.20260828.03)` | **Save Schema:** `v0.8.1`
- **Autor / Pair Programming:** Jotasiete & Antigravity (AI Assistant)

#### 🎯 Objetivos Concluídos:
1. **Unificação Global de Versão:** Sincronização de todas as tags visuais de versão na tela de boot, menu principal, menu de pausa, HUD superior e Dev Dashboard para `v0.8.1 (bld.20260828.03)`.
2. **Super Gerador Procedural de Nomes:** Expansão algorítmica para mais de 10.000 combinações realistas de nomes de CEOs e corporações.
3. **Catálogo de Avatares Expandido & Compacto:** Seletor responsivo com 24 avatares oficiais organizados em 4 categorias (Executivos, Indústria, Mercado e Robôs/IA).
4. **Alinhamento Geométrico de Sprites (`sprite_manager.js`):** Diagnóstico pixel a pixel corrigindo a ancoragem vertical de vias e a centralização de edifícios residenciais/comerciais largos de 128x64px.
5. **Tooltip Escuro de Alto Contraste:** Painel de hover do cursor com 98% de opacidade e fundo escuro contrastante eliminando a transparência excessiva.
6. **Demarcação Nítida de Limites Municipais:** Traçado de linhas pontilhadas ciano nas bordas limítrofes entre distritos e metrópoles no mapa isométrico.
7. **Sistema de Tutorial do Magnata:** Widget interativo com 5 missões guiadas para iniciantes, acompanhamento em tempo real e recompensa de +$15.000.
8. **Modulação Acústica em 5x & Celebração de Ano Novo:** Inclusão de arpeggio harmônico procedural `playYearCelebration()` para viradas de ano e silenciamento de beeps mensais repetitivos em velocidade máxima (5x).
9. **Múltiplas Linhas por Fábrica:** Suporte a até 4 linhas da mesma receita (ou receitas variadas) por parque fabril, permitindo especialização em escala.
10. **Negociação com IA Concorrente vs Demolição:** Sistema onde concorrentes da IA fazem ofertas de compra (80% da obra + 100% do estoque) e assumem pontos comerciais ativos, além de opção de demolição com 40% de sucata.
11. **Atalhos de Teclado Universais:** Mapeamento das teclas numéricas `1..5` para velocidades e `ESPAÇO` para pausar/retomar com restauração da velocidade anterior.
12. **Higienização de Código Legado:** Arquivamento seguro da pasta `core/` legada em `_archive_rascunhos/core_ts_legado/` e consolidação de `client/core_math.js` como motor matemático único.

---

### 📅 Sessão 06: Módulo Estratégico de P&D (Pesquisa & Desenvolvimento), Construção Física no Mapa, Mercado de Patentes & Zoom no Cursor
- **Data:** 28/08/2026 — 07:45
- **Versão Oficial:** `v0.8.0 (bld.20260828.02)` | **Save Schema:** `v0.8.0`

#### ðŸ› ï¸ O Que Foi Implementado:
1. **Motor MatemÃ¡tico de P&D (`core_math.js`)**:
   - `CoreMath.calculateRDMonthlyCost(currentQR, categoryBaseCost)`: Custo mensal exponencial $C = C_{base} \times e^{2.5 \cdot (QR/100)}$.
   - `CoreMath.calculateRDQualityGain(currentQR, targetQR, monthlyBudget, baseMonthlyRequired)`: Ganho de QR com aceleraÃ§Ã£o de verba (atÃ© 2.5x) e atenuaÃ§Ã£o por rendimentos decrescentes $(1 - QR/120)$.
   - `CoreMath.propagateQualityToShelf(shelfQR, factoryQR, soldToday, shelfCapacity)`: PropagaÃ§Ã£o gradual do QR da fÃ¡brica para a gÃ´ndola conforme o estoque antigo Ã© consumido e reposto.
2. **CatÃ¡logos & Estruturas de Dados (`data_catalogs.js`)**:
   - Adicionado catÃ¡logo `RD_CATEGORIES` com custos base e Ã­cones para 11 categorias de produtos.
   - Auto-populaÃ§Ã£o de `rdBaseCost` em todos os produtos do `PRODUCT_CATALOG`.
3. **Estado Global & PersistÃªncia (`index.html`)**:
   - Adicionado `rdLabs: {}` ao `GameState` e alias global.
   - SanitizaÃ§Ã£o e migraÃ§Ã£o retroativa em `migrateSaveData` e persistÃªncia total em `serializeCurrentGame` / `loadGameFromData`.
4. **Interface do Centro de P&D & Mercado de Patentes**:
   - `#rd-center-modal`: Janela arrastÃ¡vel com barra de orÃ§amento mensal, status em tempo real e alternÃ¢ncia entre abas de Projetos Ativos e Mercado de Patentes.
   - `#rd-new-project-modal`: Wizard com seleÃ§Ã£o de qualquer produto do catÃ¡logo, slider de QR alvo (60-100), input de verba mensal e estimativa de ETA/Custo Total em tempo real.
   - `buyCompetitorTech`: AquisiÃ§Ã£o direta de patentes de concorrentes com atualizaÃ§Ã£o imediata de linhas de produÃ§Ã£o.
5. **IntegraÃ§Ã£o com o Loop de SimulaÃ§Ã£o & HUD**:
   - `propagateQualityRD()` executado diariamente dentro de `simulateDay()`.
   - `processRDProgress()` executado na virada mensal dentro de `closeMonthEnd()`.
   - BotÃ£o `ðŸ”¬ P&D` com badge no Top HUD e chip na barra de telemetria.
   - Indicadores de P&D nos cards de linhas de montagem das fÃ¡bricas e prateleiras das lojas.
6. **Zoom Ancorado no Cursor**:
   - `changeZoom` recalculando `camera.panX/panY` com pivÃ´ sob o ponteiro do mouse.

---

### ðŸ“… SessÃ£o 05: Sistema Universal de Janelas ArrastÃ¡veis, HUD Multi-ResoluÃ§Ã£o & GestÃ£o ImobiliÃ¡ria
- **Data:** 27/08/2026 â€” 19:20
- **VersÃ£o Oficial:** `v0.7.4 (bld.20260827.07)` | **Save Schema:** `v0.7.2`
- **Autor / Pair Programming:** Jotasiete & Antigravity (AI Assistant) *(InovaÃ§Ã£o de janelas mÃ³veis originada por Kaligola)*

#### ðŸŽ¯ Objetivos:
- Assimilar a funcionalidade de janelas arrastÃ¡veis trazida pelo Kaligola, modernizando-a e integrando-a com foco dinÃ¢mico.
- Integrar a interface de **Venda e DemoliÃ§Ã£o de InstalaÃ§Ãµes** no rodapÃ© dos painÃ©is de gestÃ£o e telemetria rÃ¡pida.
- Eliminar o erro vermelho do console (`Uncaught ReferenceError: pill is not defined`).
- Corrigir o problema de layout onde o topo colidia em laptops (1366x768 / 1280x720 / 125% DPI).
- Restabelecer o menu de construÃ§Ã£o interativo ao clicar em terrenos livres e atalhos rÃ¡pidos na telemetria.
- Eliminar a duplicidade de minimapas sobrepostos.
- Estabelecer a regra oficial de versionamento `GAME_VERSION_INFO` SemVer 2.0 + Build Stamp.

---

### ðŸ“… SessÃ£o 04: Motor de Ãudio Web Audio API SintÃ©tico
- **Data:** 27/08/2026
- **VersÃ£o:** `v0.7.3 (bld.20260827.04)`

---

### ðŸ“… SessÃ£o 03: Sparse Indexing O(k) & OtimizaÃ§Ã£o de Performance
- **Data:** 27/08/2026
- **VersÃ£o:** `v0.7.2 (bld.20260827.03)`

---

### ðŸ“… SessÃ£o 02: Pipeline de Saves e MigraÃ§Ãµes Retroativas
- **Data:** 27/08/2026
- **VersÃ£o:** `v0.7.1 (bld.20260827.02)`

---

### ðŸ“… SessÃ£o 01: RefatoraÃ§Ã£o da Arquitetura EconÃ´mica & Cadeias Produtivas
- **Data:** 27/08/2026
- **VersÃ£o:** `v0.7.0 (bld.20260827.01)`