# ðŸ“” OIKONOMIA â€” DiÃ¡rio dos Desenvolvedores (DevLog & Agenda TÃ©cnica)

> **Documento Oficial de Rastreabilidade, Versionamento e EvoluÃ§Ã£o do Projeto**  
> **RepositÃ³rio:** `Jotasiete7/OIKONOMIA-game`  
> **Ãšltima AtualizaÃ§Ã£o:** 28 de Agosto de 2026  
> **VersÃ£o Oficial Corrente:** `v0.8.0 (bld.20260828.02)`  
> **Save Schema:** `v0.8.0` (Compatibilidade Retroativa Total)

---

## ðŸ›ï¸ PadrÃ£o Oficial de Versionamento da Equipe (SemVer 2.0 + Build Stamp)

Todo o projeto segue estritamente a convenÃ§Ã£o:
$$\mathbf{vMAJOR}.\mathbf{MINOR}.\mathbf{PATCH}+\mathbf{bld.YYYYMMDD.XX}$$

- **MAJOR (v1.0.0, v2.0.0)**: Marcos definitivos de lanÃ§amento comercial / saÃ­da de Beta.
- **MINOR (v0.7.x -> v0.8.0)**: Grandes mÃ³dulos ou mecÃ¢nicas novas (ex: P&D, frotas visuais, bolsa).
- **PATCH (v0.7.3 -> v0.7.4)**: Novas telas, melhorias de UI/UX, janelas arrastÃ¡veis, correÃ§Ãµes de bugs.
- **BUILD STAMP (`bld.YYYYMMDD.XX`)**: Carimbo diÃ¡rio com a data e o nÃºmero da entrega daquele dia.
- **SAVE SCHEMA (`0.8.0`)**: Controla a compatibilidade dos saves `.oiko` e do `localStorage`.

---

## ðŸ§­ Agenda de Desenvolvimento (PrÃ³ximos Passos Priorizados)

- [ ] **QG Corporativo & Diretoria Executiva (v0.9.0)**: Sede global Ãºnica com contrataÃ§Ã£o de CEO, COO, CMO, CTO e CFO com bÃ´nus setoriais.
- [ ] **IA Concorrente com P&D DinÃ¢mico**: Concorrentes evoluindo tecnologia mensalmente e disputando patentes de ponta.
- [ ] **MÃ³dulo de LogÃ­stica Visual**: Adicionar caminhÃµes/frotas navegando pelas avenidas entre metrÃ³poles e fÃ¡bricas.
- [ ] **Bolsa de Valores & EmprÃ©stimos BancÃ¡rios**: Sistema financeiro para emissÃ£o de aÃ§Ãµes e debÃªntures.
- [ ] **Polimento GrÃ¡fico & Efeitos IsomÃ©tricos**: Sombras dinÃ¢micas nos edifÃ­cios e ciclo dia/noite.

---

## ðŸ“œ HistÃ³rico de SessÃµes & Registros de EvoluÃ§Ã£o

---

### ðŸ“… SessÃ£o 06: MÃ³dulo EstratÃ©gico de P&D (Pesquisa & Desenvolvimento), ConstruÃ§Ã£o FÃ­sica no Mapa, Mercado de Patentes & Zoom no Cursor
- **Data:** 28/08/2026 â€” 07:45
- **VersÃ£o Oficial:** `v0.8.0 (bld.20260828.02)` | **Save Schema:** `v0.8.0`
- **Autor / Pair Programming:** Jotasiete & Antigravity (AI Assistant)

#### ðŸŽ¯ Objetivos:
- Implementar a **construÃ§Ã£o fÃ­sica do Centro de P&D (LaboratÃ³rio) no mapa**, acessÃ­vel pelo menu de terrenos livres e barra de ferramentas rÃ¡pida.
- Integrar o sistema de **Pesquisa & Desenvolvimento (P&D)** modelado fielmente apÃ³s o **Capitalism II / Capitalism Lab**.
- Introduzir a mecÃ¢nica de corrida tecnolÃ³gica de qualidade (Quality Rating - QR) de 0 a 100 com curvas de custo exponencial e rendimentos decrescentes (money sink estratÃ©gico).
- Criar o **Mercado de Patentes & AquisiÃ§Ã£o Direta de Tecnologia** para compra/licenciamento instantÃ¢neo de tecnologias de concorrentes lÃ­deres.
- Conectar a propagaÃ§Ã£o diÃ¡ria de QR para as gÃ´ndolas de varejo (`propagateQualityToShelf`) e atualizaÃ§Ã£o automÃ¡tica das linhas de manufatura.
- Permitir venda e demoliÃ§Ã£o fÃ­sica do Centro de P&D com recuperaÃ§Ã£o de 70% e 40% respectivamente.

#### ðŸŽ¯ Objetivos:
- Implementar o sistema completo de **Pesquisa & Desenvolvimento (P&D)** modelado fielmente apÃ³s o **Capitalism II / Capitalism Lab**.
- Introduzir a mecÃ¢nica de corrida tecnolÃ³gica de qualidade (Quality Rating - QR) de 0 a 100 com curvas de custo exponencial e rendimentos decrescentes (money sink estratÃ©gico).
- Criar o **Mercado de Patentes & AquisiÃ§Ã£o Direta de Tecnologia** para compra/licenciamento instantÃ¢neo de tecnologias de concorrentes lÃ­deres.
- Conectar a propagaÃ§Ã£o diÃ¡ria de QR para as gÃ´ndolas de varejo (`propagateQualityToShelf`) e atualizaÃ§Ã£o automÃ¡tica das linhas de manufatura.
- Integrar a interface do Centro de P&D (`#rd-center-modal` e `#rd-new-project-modal`) com suporte a janelas arrastÃ¡veis (`makeDraggable`).
- Adicionar indicadores visuais de P&D no Top HUD, na barra de telemetria e nos cards de gestÃ£o de fÃ¡bricas e lojas.
- Corrigir o zoom do mouse por scroll para pivotar dinamicamente sob o cursor (`changeZoom(delta, pivotX, pivotY)`).

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