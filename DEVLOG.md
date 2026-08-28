# 🏛️ OIKONOMIA — Diário dos Desenvolvedores (DevLog & Agenda Técnica)

> **Documento Oficial de Rastreabilidade, Versionamento e Evolução do Projeto**  
> **Repositório:** `Jotasiete7/OIKONOMIA-game`  
> **Última Atualização:** 28 de Agosto de 2026  
> **Versão Oficial Corrente:** `v0.8.1 (bld.20260828.03)`  
> **Save Schema:** `v0.8.1` (Compatibilidade Retroativa Total com Migrações)

---

## 🏷️ Padrão Oficial de Versionamento da Equipe (SemVer 2.0 + Build Stamp)

Todo o projeto segue estritamente a convenção:
$$\mathbf{vMAJOR}.\mathbf{MINOR}.\mathbf{PATCH}+\mathbf{bld.YYYYMMDD.XX}$$

- **MAJOR (v1.0.0, v2.0.0)**: Marcos definitivos de lançamento comercial / saída de Beta.
- **MINOR (v0.7.x -> v0.8.0 -> v0.9.0)**: Grandes módulos ou mecânicas novas (ex: P&D, QG Corporativo, frotas visuais).
- **PATCH (v0.8.0 -> v0.8.1)**: Pacotes de usabilidade, balanceamento, sprites, tutorial, IA e refinamentos.
- **BUILD STAMP (`bld.YYYYMMDD.XX`)**: Carimbo diário com a data e o número da entrega daquele dia.
- **SAVE SCHEMA (`0.8.1`)**: Controla a compatibilidade dos saves `.oiko` e do `localStorage`.

---

## 🧭 Agenda de Desenvolvimento (Próximos Passos Priorizados)

- [ ] **QG Corporativo & Diretoria Executiva (v0.9.0)**: Sede global única com contratação de CEO, COO, CMO, CTO e CFO com bônus setoriais.
- [ ] **IA Concorrente com P&D Dinâmico**: Concorrentes evoluindo tecnologia mensalmente e disputando patentes de ponta.
- [ ] **Módulo de Logística Visual**: Adicionar caminhões/frotas navegando pelas avenidas entre metrópoles e fábricas.
- [ ] **Bolsa de Valores & Empréstimos Bancários**: Sistema financeiro para emissão de ações e debêntures.
- [ ] **Polimento Gráfico & Efeitos Isométricos**: Sombras dinâmicas nos edifícios e ciclo dia/noite.

---

## 📜 Histórico de Sessões & Registros de Evolução

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