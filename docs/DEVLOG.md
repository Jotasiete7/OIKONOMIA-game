# 🏛️ OIKONOMIA — Diário dos Desenvolvedores (DevLog & Agenda Técnica)

> **Documento Oficial de Rastreabilidade, Versionamento e Evolução do Projeto**  
> **Repositório:** `Jotasiete7/OIKONOMIA-game`  
> **Última Atualização:** 11 de Setembro de 2026  
> **Versão Oficial Corrente:** `v0.8.5 (bld.20260911.07)`  
> **Save Schema:** `v0.8.2` (Compatibilidade Retroativa Total com Migrações)

---

## 🏷️ Padrão Oficial de Versionamento da Equipe (SemVer 2.0 + Build Stamp)

Todo o projeto segue estritamente a convenção:
$$\mathbf{vMAJOR}.\mathbf{MINOR}.\mathbf{PATCH}+\mathbf{bld.YYYYMMDD.XX}$$

- **MAJOR (v1.0.0, v2.0.0)**: Marcos definitivos de lançamento comercial / saída de Beta.
- **MINOR (v0.7.x -> v0.8.0 -> v0.9.0)**: Grandes módulos ou mecânicas novas (ex: P&D, QG Corporativo, frotas visuais).
- **PATCH (v0.8.4 -> v0.8.5)**: Pacotes de usabilidade, modularização, inteligência executiva, áudio, balanceamento e refinamentos de UI.
- **BUILD STAMP (`bld.YYYYMMDD.XX`)**: Carimbo diário com a data e o número da entrega daquele dia.
- **SAVE SCHEMA (`0.8.2`)**: Controla a compatibilidade dos saves `.oiko` e do `localStorage`.

---

## 🧭 Agenda de Desenvolvimento (Próximos Passos & Backlog Priorizado)

- [x] **Grande Modularização da Arquitetura (Fases 7.0 A até 7.0 K - v0.8.5)**: Desacoplamento integral do monolito original de 9.762 linhas para 373 linhas (-96.2%), separação em ES Modules, Tailwind CSS local em `client/styles/`, 10 controladores modais em `client/ui/panels/`, 3 wizards em `client/ui/wizards/` e templates HTML modulares em `client/ui/templates/`.
- [x] **Redesign Visual do HUD & Menus (Terminal Executivo Obsidian & Gold - v0.8.5)**: TopBar contínua 44px, pílulas companheiras de navegação de cidades/lentes, dropdown Mais Opções balanceado, menu de pausa ESC e Diretoria Executiva integrados à identidade visual dark fintech / Bloomberg terminal.
- [x] **Diretoria Executiva & Inteligência Estratégica (v0.8.5)**: Painel executivo unificado (CFO, COO, CMO), 6 KPIs semaforizados, diagnóstico causal cruzado, máquina de estados anti-spam (+20%), auto-resolução positiva e deep-links de navegação isométrica.
- [x] **Sistema Bancário & Financiamento Corporativo (Banco Central - v0.8.5)**: Empréstimos corporativos de curto, médio e longo prazo amortizados mensalmente na DRE com taxas e limites dinâmicos baseados no Score e Rating Corporativo (AAA a B).
- [ ] **Fase 4 Contratos Públicos & Editais Municipais (v0.9.0)**: Fornecimento contínuo para prefeituras das 4 cidades com metas de quantidade, QR mínimo, bônus contratuais e multas por inadimplência.
- [ ] **Fase 5 Mercado Financeiro, Ações & M&A**: Ações corporativas, IPO, distribuição de dividendos, participações cruzadas e aquisições hostis (*Hostile Takeovers*).
- [ ] **Módulo de Logística Visual**: Frotas de caminhões e navios com animação isométrica navegando pelas rodovias e rotas marítimas entre portos e cidades.
- [ ] **Fase 6 Dinâmica Macroeconômica & Clima**: Geadas, secas e safras recordes impactando o rendimento agropecuário; greves portuárias e flutuação de frete internacional.

---

## 📜 Histórico de Sessões & Registros de Evolução

---

### 📅 Sessão 18: Grande Modularização Arquitetural & Componentização (Fases 7.0 A a 7.0 K)
- **Data:** 11/09/2026 — 19:35
- **Versão Oficial:** `v0.8.5 (bld.20260911.07)` | **Save Schema:** `v0.8.2`
- **Branch:** `main`
- **Autor / Pair Programming:** Jotasiete & Antigravity (AI Assistant)

#### 🎯 Entregas da Sessão (Desacoplamento do Monolito de 9.762 linhas):
1. **Fase 7.0 A (Assistentes de Construção, Gôndolas & Fornecedores)**:
   - Modularização em `client/ui/wizards/` (`store_wizard.js`, `construction_wizards.js`, `supplier_picker.js`).
2. **Fase 7.0 B (Controladores Especializados de Painéis Modais)**:
   - Modularização de 10 painéis em `client/ui/panels/` (`advisor_panel.js`, `banking_panel.js`, `dre_panel.js`, `tech_tree_panel.js`, `rd_panel.js`, `encyclopedia_panel.js`, `facility_panel.js`, `marketing_panel.js`, `price_simulator_panel.js`, `dev_dashboard_panel.js`).
3. **Fase 7.0 C (Motor Cartográfico & Depósitos Geológicos)**:
   - Desacoplamento de `client/engine/world_grid.js` com matriz 128×128, topografia procedural e sparse index espacial $O(k)$.
4. **Fase 7.0 D (Dev Dashboard & Sandbox de Precificação)**:
   - Suíte de auditoria e telemetria F3/F8 com captura e sanitização de telas para relatórios de bugs.
5. **Fase 7.0 E (Pipeline de Persistência, Saves & Ciclo de Vida)**:
   - Modularização em `client/save_system.js` e `client/app/lifecycle.js` (gerenciador de slots, autosave e micro rádio).
6. **Fase 7.0 F, G & H (Economia, Logger, Input & GameState Container)**:
   - `client/game_state.js` como Single Source of Truth com proxies reativos bidirecionais (`Object.defineProperty`).
   - `client/core_math.js`, `client/simulation.js`, `client/input/keyboard.js`, `client/ui/hud.js`.
7. **Fase 7.0 I (Bootstrap Unificado & Eliminação de Scripts Inline)**:
   - Criação de `client/app/bootstrap.js` e orquestração automática no evento `DOMContentLoaded` em `client/main.js`.
   - **Zero scripts inline no `index.html`** (-655 linhas eliminadas).
8. **Fase 7.0 J (Extração de Estilos CSS Embutidos)**:
   - Criação de `client/styles/ui.css` e `client/styles/banking.css`, integrados via `@import` no Tailwind CSS.
   - **Zero tags `<style>` no `index.html`** (-132 linhas eliminadas).
9. **Fase 7.0 K (Componentização dos Templates HTML dos Modais)**:
   - Separação dos ~1.870 linhas de modais em 4 templates modulares (`finance_modals.html`, `operations_modals.html`, `wizards_modals.html`, `system_overlays.html`) montados dinamicamente via Vite (`?raw`).
   - `client/index.html` reduzido para **373 linhas** (**-96.2% do monolito original**).
   - Bundle `dist/index.html` reduzido para **26.76 kB** (gzip: **7.48 kB**).
   - 100% dos testes E2E aprovados sem nenhum erro de console no navegador.

---

### 📅 Sessão 17: Redesign Visual do HUD & Menus (Terminal Executivo Obsidian & Gold)
- **Data:** 08/09/2026 — 00:20
- **Versão Oficial:** `v0.8.5 (bld.20260908.01)` | **Save Schema:** `v0.8.2`
- **Branch:** `feat/redesign-hud-terminal`
- **Autor / Pair Programming:** Jotasiete & Antigravity (AI Assistant)

#### 🎯 Entregas da Sessão (Identidade Visual Dark Terminal & Usabilidade de HUD):
1. **Design System Terminal Executivo (`client/style.css`):**
   - Introduzido conjunto completo de design tokens `:root` para o Terminal Executivo: Obsidian Dark (`--oiko-bg-0` até `--oiko-bg-3`), Ouro Executivo (`--oiko-gold: #c9a86a`), Esmeralda (`--oiko-green`), Carmesim (`--oiko-red`) e família mono (`--oiko-font-mono: 'JetBrains Mono', monospace`).
   - Importação oficial do Google Font `JetBrains Mono` e configuração de numerais tabulares anti-trepidação (`font-variant-numeric: tabular-nums lining-nums`).
   - Utilitários globais criados: `.oiko-topbar`, `.oiko-btn-terminal`, `.oiko-dropdown-menu`, `.oiko-dropdown-item`.
2. **Unificação da Barra Superior (TopBar) e Navegação de Cidades:**
   - Substituição dos 3 blocos flutuantes legados por uma TopBar executiva única e contínua de 44px de altura.
   - Unificação dos 4 botões longos de cidades no seletor pílula `[ 🏛️ Atenas ▾ ]`, companion do seletor de lentes de dados `[ ⊙ Terreno ▾ ]`.
   - Dropdown escuro com cidades, especialidades econômicas e travas (`🔒`), atualizando dinamicamente o rótulo da cidade ativa e fechando automaticamente ao selecionar ou clicar fora.
3. **Distribuição do Dropdown "Mais Opções" & Blindagem do HUD:**
   - Redesenhado o dropdown `hud-more-options-menu` (`w-56`) com distribuição limpa via `flex justify-between`, atalho `F1` discreto e tag de tutorial compacta `0/7` sem quebras de linha.
   - Corrigido `updateAdvisorHUDChip()` para manter a classe `.oiko-btn-terminal relative`, sinalizando alertas com bordas sutis e badges numéricos sem estufar a altura ou largura dos botões do HUD.
4. **Redesign do Menu de Pausa [ESC]:**
   - Substituído o modal legado por card Obsidian `#0d1017` com bordas suaves `border-white/[0.08]`.
   - Botão principal `▶ Retomar Jogo` em Ouro Executivo `#c9a86a` de alto contraste com indicador `ESC`.
   - Seção de mixagem de áudio com sliders dourados (`accent-[#c9a86a]`) e porcentagens mono tabulares.
   - Botão de saída discreto em perigo atenuado e rodapé com versão e Dev Dashboard (`F3`).
5. **Redesign da Diretoria Executiva & Inteligência de Negócios:**
   - Substituição do tema azul royal por Obsidian & Gold.
   - Semáforos com métricas mono e acentos refinados.
   - Seletor de verbosidade e abas de personas integradas.
   - Rodapé com dica sutil e botão de reavaliação de operação estilizado.
6. **Garantia de Qualidade & Testes E2E:**
   - 100% dos IDs, atalhos de teclado e eventos do DOM preservados.
   - Compilação Vite concluída com 0 erros (`npm run build`).
   - Todos os 6 testes ponta-a-ponta no Chromium/Edge headless aprovados com 100% de êxito (`npm run audit-browser`).
   - Evidências e screenshots arquivados em `docs/auditoria/screenshots/` e documentados no artefato `walkthrough.md`.

---

### 📅 Sessão 16: Diretoria Executiva & Conselheiro Inteligente (CFO, COO, CMO), Galeria Tecnológica de Patentes e Foco Isométrico
- **Data:** 06/09/2026 — 18:30
- **Versão Oficial:** `v0.8.5 (bld.20260906.01)` | **Save Schema:** `v0.8.2`
- **Autor / Pair Programming:** Jotasiete & Antigravity (AI Assistant)

#### 🎯 Entregas da Sessão (Inteligência Corporativa, Refinamento de P&D e Navegação Isométrica):
1. **Novo Subsistema de Inteligência Corporativa (`client/advisor_system.js`):**
   - Implementado o módulo `advisor_system.js` com avaliação de **Pulso de Saúde Corporativa (`evaluateCorporatePulse`)** abrangendo 6 pilares: Finanças (CFO), Produção (COO), Logística (COO), Varejo (COO/CMO), Mercado (CMO) e Inovação (CTO/CMO), sintetizados em um Score Global (0 a 100).
   - **Grafo de Causa-Raiz Cruzada (`diagnoseCorporateIssues`)**: rastreamento inteligente de rupturas de prateleira conectadas à falta de estoque em centros de distribuição e fábricas, alerta de fábricas e minas ociosas com custo fixo, aviso preventivo de caixa negativo e juros de cheque especial (3.5%/mês), além de oportunidades de inovação em produtos com QR básico em mercados competitivos.
   - **Máquina de Estados Anti-Spam (`updateAdvisorAlertStates`)**: estados `new`, `acknowledged` (dispensado), `snoozed` e `resolved`. Regra de piora de +20%: alertas dispensados não reaparecem no mês seguinte a menos que a métrica se degrade em pelo menos 20%.
   - **Feedback Positivo Automático**: quando o jogador resolve um gargalo operacional, o conselho registra no histórico do diário: *"✅ Problema normalizado! [Título] foi solucionado na operação corporativa."*
   - **Filtros Temporais Anti-Falso Positivo**: período de graça de 30 dias para construções recentes e colchão de caixa proporcional para evitar alertas prematuros.
2. **Interface Visual da Diretoria Executiva (`client/index.html`):**
   - Botão dinâmico no Top HUD (`#btn-hud-advisor`) com selo numérico de alertas e cor reativa (azul neutro, amarelo moderado, vermelho crítico).
   - Modal da Diretoria Executiva com 6 cartões semaforizados no topo, abas por perfil executivo (`[ 🏢 Todos ]`, `[ 💼 CFO ]`, `[ 🚚 COO ]`, `[ 📈 CMO ]`), seletor de verbosidade (`Novato`, `Expert`, `Silencioso`) e aba de Histórico de Resoluções.
3. **Correção de Deep-Links e Navegação de Câmera Isométrica:**
   - Criada a função matemática `focusOnTile(gx, gy)` para converter coordenadas de grid em posição isométrica centralizada no canvas (`camera.panX`, `camera.panY`), integrando com minimapa e agendador de render.
   - Ações de inspeção do conselheiro (`executeAdvisorDeepLink`) agora fecham o modal, transicionam a câmera instantaneamente para o lote com defeito e abrem a janela de gerenciamento ou o modal logístico correspondente.
4. **Despoluição e Galeria de Patentes no P&D:**
   - Separadas rigidamente as bancadas de laboratório ativas dos projetos já finalizados.
   - Criado o **Acervo de Patentes** com indicador de Nível Tecnológico da Holding (Nível 1 a 4 - Vanguarda Tecnológica) e chips recolhíveis dourados/esmeralda com accordion.
   - Adicionadas abas de filtros rápidos no modal completo de P&D (`[ 🏢 Todas ]`, `[ 🟢 Em Andamento ]`, `[ 🏆 Patentes Concluídas ]`).
   - Corrigida a contabilidade visual de projetos concluídos (`Verba: Consolidada ($0/mês)`).
   - Adicionado fluxo seguro de arquivamento (`cancelRDProject`), garantindo que patentes arquivadas continuem ativas no know-how da holding e em suas fábricas.

---

### 📅 Sessão 15: Correção da Economia Automotiva, Arredondamento Estocástico de Demanda, Standby Ocioso e Reparo de Cadeia
- **Data:** 05/09/2026 — 23:25
- **Versão Oficial:** `v0.8.4 (bld.20260905.03)` | **Save Schema:** `v0.8.2`
- **Autor / Pair Programming:** Jotasiete & Antigravity (AI Assistant)

#### 🎯 Entregas da Sessão (Correção Matemática, Balanceamento de OPEX e Resolução de Gargalos):
1. **Identificação e Correção do Bug de Truncamento a Zero (`Math.floor`):**
   - Diagnosticado bug na simulação diária de varejo (`client/simulation.js`), onde produtos duráveis/alto valor agregado com consumo per capita fracionário (< 1 un/dia, ex.: Carro Compacto com 0.48 un/dia) eram truncados estritamente para zero todo dia, fazendo a Concessionária faturar $0,00 por meses a fio.
   - Implementado **Arredondamento Estocástico (Poisson/Bernoulli tick)**: `Math.floor(rawDemand) + (Math.random() < (rawDemand % 1) ? 1 : 0)`. A probabilidade diária reflete a fração exata, restaurando a média mensal de 14 a 16 carros/mês e gerando mais de $200.000/mês de receita para a holding.
2. **Custo Operacional Reduzido em Ociosidade / Standby de Linhas Fabris e Minas:**
   - Fábricas com armazém de produto acabado lotado (3.000 un) e minas com pátio cheio (8.000 un) agora entram em modo Standby, reduzindo o custo operacional de mão de obra e energia em até 65-70% ($70/dia vs $200/dia por linha fabril, $65/dia vs $180/dia por mina).
3. **Reparo Automatizado de Cadeias de Suprimentos Quebradas:**
   - Adicionado sanitizador no pipeline `migrateSaveData()` em `client/save_system.js`: quando uma linha industrial aponta para um armazém fornecedor demolido ou ausente no mapa (como ocorria com os insumos químicos de pneus apontando para um CD 45, 40 inexistente), o motor reconecta o fluxo automaticamente para a mina ou indústria produtora compatível mais próxima (`mine_68_42`).
4. **Refinamento do Modal de Simulação de Preço & Métricas de Varejo:**
   - Atualizado `updatePriceSimulation()` em `client/index.html` para projetar vendas diárias fracionárias e o acumulado mensal (`0.49 un/dia (~15 un/mês)`), eliminando o falso indicativo de faturamento nulo.
   - Atualizada a estimativa de cobertura de estoque (`daysCover`) para considerar a demanda real contínua.
5. **Identificação e Resolução Definitiva do Sumiço de Armazéns & Silos de Estoque:**
   - Diagnosticada a causa raiz do desaparecimento de Centros de Distribuição / Armazéns (`warehouse`): as rotinas `extractBuiltTiles()` e `applyBuiltTiles()` em `client/index.html` serializavam apenas `store`, `mine`, `farm`, `factory`, `rdCenter` e `competitor`, omitindo deliberadamente o atributo `warehouse`.
   - Ao salvar a partida (inclusive nos auto-saves de fechamento de mês) ou recarregar a sessão, qualquer lote contendo exclusivamente um Armazém era descartado do array `builtTiles`, deletando a estrutura física e pulverizando todo o estoque contido (o que provocou o sumiço do CD `warehouse_45_40` e rompeu a linha de vulcanização de pneus).
   - Adicionado suporte nativo e persistente a `warehouse` em `extractBuiltTiles()` e `applyBuiltTiles()`, com altura isométrica adequada (`buildingHeight = 20`) e validação de sobreposição em `confirmBuildRDCenter`.
   - Restaurado o lote `(45, 40)` em `saves/Save_A_Guilda_1_slot_1788660755873.oiko` contendo o `CD & Silos Logísticos` e 5.000 un de `chemical_minerals`.
   - Atualizada a semente em `client/recovered_saves_seed.js` com auto-cura proativa no `localStorage` caso o slot do jogador tenha sido gravado sem o armazém antes do patch.
6. **Correção Crítica de Referência de Elasticidade em `renderStorePanel` (Destravamento de Dias e Painéis de Lojas):**
   - Corrigido `ReferenceError: elast is not defined` em `client/index.html` (linha 5501) no painel de varejo.
   - O erro ocorria ao abrir o painel de qualquer loja (Drogaria, Kombini, Supermercado, Concessionária) e no loop diário `updateUI()`, abortando o tick de simulação diária (`simulateDay`).
   - Adicionada a declaração explícita de `elast = calcElasticity(...)`, restaurando a visualização e gestão das gôndolas e liberando a passagem contínua do tempo.
7. **Eliminação do Race Condition de Inicialização (`PRODUCT_CATALOG is not defined`):**
   - Corrigido travamento no boot onde a função `bootEngine()` usava um timeout frágil de 300ms aguardando os 16 módulos ESM carregados pelo Vite dev server. Em cold starts, o Vite levava mais de 300ms e disparava `initMasterData` antes de `PRODUCT_CATALOG` ser injetado no `window` por `main.js`.
   - Implementado polling com timeout resiliente de 10s no evento `oiko:ready`, declaração prévia de variáveis no escopo global e sincronização imediata em `initMasterData()`.
8. **Eliminação Definitiva do Glitch Visual de Inicialização (Escudo Anti-FOUC):**
   - Diagnosticada a causa do "glitch" de 1 a 2 segundos onde imagens e menus apareciam fora de lugar ao abrir a página: o Tailwind CSS v4 era importado apenas dentro de `main.js` (módulo JS diferido), fazendo com que o HTML renderizasse sem as classes `.hidden`, `fixed` e sem controle dimensional até o Vite terminar de processar o script.
   - Inserida a folha de estilo `<link rel="stylesheet" href="./style.css">` no `<head>` e declaradas regras inline anti-FOUC forçando `display: none !important` para `.hidden` e posicionamento fixo tela cheia no `#loading-screen` (`z-index: 99999`) a partir do primeiro milissegundo de parsing do DOM.
9. **Correção do Travamento do Mapa Isométrico e Blindagem de `SpriteManager` no Loop de Renderização:**
   - Diagnosticado erro `Uncaught ReferenceError: SpriteManager is not defined` em `renderMap()` (linha 3134) chamado por `_rafLoop`.
   - Causa raiz: o loop `requestAnimationFrame` iniciava a renderização de frames antes de `SpriteManager` e outros módulos do `main.js` estarem vinculados, e a exceção não capturada encerrava o loop de renderização do canvas para sempre, deixando o mapa completamente preto no jogo.
   - Declarados todos os símbolos e módulos globais no topo do script com sincronização no evento `oiko:ready`.
   - Adicionado `try/catch` de segurança no `_rafLoop` para impedir que o ciclo de 60 FPS seja abortado.
   - Refatorada a chamada de desenho com fallback elegante para o renderizador vetorial 3D caso os sprites ainda não estejam disponíveis.

---

### 📅 Sessão 14: Recuperação dos Saves Descentralizados (A Guilda 1), Trava Estrita de Porta no Vite e Persistência Completa de Áudio e Mute
- **Data:** 05/09/2026 — 15:00
- **Versão Oficial:** `v0.8.4 (bld.20260905.02)` | **Save Schema:** `v0.8.2`
- **Autor / Pair Programming:** Jotasiete & Antigravity (AI Assistant)

#### 🎯 Entregas da Sessão (Resgate de Dados, Estabilidade de Origem e Sistema de Som):
1. **Investigação Profunda & Resgate de Saves em LevelDB:**
   - Diagnosticada a causa do "desaparecimento" do save **"A Guilda 1"**: o Vite operava com `strictPort: false`, saltando silenciosamente para a porta `5175` quando a porta padrão `5173` estava temporariamente ocupada. Devido ao isolamento de segurança do HTML5 LocalStorage por porta/origem no navegador (Opera GX), saves gravados em `localhost:5175` ficavam inacessíveis em `localhost:5173` ou em `file:///`.
   - Desenvolvida rotina automatizada de extração via Chrome DevTools Protocol (CDP) que varreu todos os armazenamentos locais e resgatou 100% dos dados intactos de **"A Guilda 1"** (Ano 3, Caixa $200.797), **"A GUILDA"** (Ano 5, Caixa $306.601), **"Prime Varejo"**, e de todos os slots legados de `file://`.
   - Exportados todos os arquivos físicos `.oiko` recuperados para a pasta `saves/` na raiz do projeto.
2. **Módulo de Semente e Reconciliação Automática de Saves:**
   - Criado `client/recovered_saves_seed.js` contendo os dados canônicos recuperados de "A Guilda 1" e "A GUILDA".
   - Implementada a função `reconcileSavesIndex()` em `client/save_system.js`, que varre o LocalStorage em busca de quaisquer chaves `oiko_save_*` e as integra dinamicamente ao índice visual da interface, garantindo que nenhum save existente fique oculto.
   - Refatorada a rota de fallback em `client/index.html` via `window._saveSystem` com prevenção rigorosa de recursão infinita (`RangeError`).
3. **Trava Rígida de Porta no Vite (`strictPort: true`):**
   - Configurado `server: { port: 5173, strictPort: true }` no `vite.config.mjs`, garantindo que o servidor de desenvolvimento nunca mais troque de porta sem consentimento, eliminando para sempre a fragmentação de LocalStorage entre portas.
4. **Persistência Completa de Configurações de Áudio (Volume, Mute e Rádio):**
   - Expandida a estrutura `gameSettings` em `client/game_state.js`, `client/save_system.js` e `client/index.html` para incluir `isMusicMuted`, `repeatMode`, `currentBgmKey`, `masterVolume`, `musicVolume`, `ambienceVolume` e `sfxVolume`.
   - Serialização do bloco `settings` adicionada diretamente aos snapshots de save (.oiko e slots locais).
   - Sanitização no pipeline `migrateSaveData()` para preservar preferências do jogador entre versões.
   - Sincronização imediata em `SoundEngine.init()`, `toggleMusicMute()` e `toggleRepeatMode()`, persistindo o status instantaneamente em `localStorage`.
5. **Respeito Absoluto ao Mute no Fluxo de Jogo & "Continuar":**
   - Corrigido o disparo forçado de trilha sonora em `hideMainMenu()` e `showMainMenu()`. Agora, o motor verifica `SoundEngine.isMusicMuted` e `musicVolume`: se o jogador silenciou a música, o jogo inicia ou retoma em silêncio absoluto sem interrupções.
   - Restauração automática do perfil sonoro gravado no save ao clicar em **"Continuar"** ou carregar qualquer arquivo `.oiko`.

---

### 📅 Sessão 13: Refinamento de UI, Expansão de Sprites Isométricos 2.5D, Buscador Agropecuário e Monitor Inteligente de Ração Animal
- **Data:** 05/09/2026 — 00:00
- **Versão Oficial:** `v0.8.4 (bld.20260905.01)` | **Save Schema:** `v0.8.2`
- **Autor / Pair Programming:** Jotasiete & Antigravity (AI Assistant)

#### 🎯 Entregas da Sessão (Correções de Usabilidade, Sprites e Telemetria Operacional):
1. **Correção do Ícone de Silvicultura & Mapeamento Canônico de Sprites:**
   - Diagnosticada a falha de renderização do ícone de silvicultura (madeira), que ocorria por ausência de sprite específico e inconsistência de mapeamento.
   - Criados métodos canônicos `getFarmSpriteKey(subtype)` e `getMineSpriteKey(resource)` em `client/sprite_manager.js`.
   - Gerado o sprite temático `farm_timber.png` (reflorestamento/eucaliptos e toras de madeira em 2.5D) e sincronizado em `client/assets/agricultura/`, `client/assets/agro/` e `OIKONOMIA-buildings/agricultura/`.
2. **Buscador Dinâmico no Modal de Propriedades Agropecuárias (`#farm-modal`):**
   - Adicionado campo de busca instantânea `#farm-search-input` com filtro textual em tempo real.
   - Refatorada a renderização de tipos de fazenda para `renderFarmTypesList(filterText)` e `filterFarmTypes()`, permitindo localizar rapidamente qualquer cultura agrícola, pecuária ou florestal entre os mais de 10 tipos de produção rural.
3. **Novo Sprite Isométrico e Painel de Centro de Pesquisa & Desenvolvimento (P&D):**
   - Criada arte isométrica 2.5D em alta resolução `rd_center.png` (cúpula geodésica futurista com antena parabólica e anexos de laboratório tecnológico).
   - Registrada no catálogo de ativos `SpriteManager.ASSET_CATALOG.rd_center` e implementado getter `getRDSprite()`.
   - Atualizado o renderizador do canvas para desenhar a cúpula tecnológica sobre tiles com `tile.rdCenter` e enriquecido o modal de P&D (`renderRDCenterPanel`) com preview visual do edifício.
4. **Sprites e Identidade Visual para Fábricas e Indústrias Pesadas:**
   - Criada arte isométrica 2.5D detalhada `industry_heavy.png` (galpão industrial manufatureiro com chaminés fumegantes e silos de carga) em `client/assets/industrial/` e `client/assets/empresas/`.
   - Corrigido bug de renderização no canvas onde a verificação de atividade industrial lia `tile.factory.activeLines` em vez de `tile.factory.lines`.
   - Integrado preview visual dinâmico no modal de criação e inspeção de fábricas (`renderFactoryPanel`).
5. **Verificação e Normalização da Fazenda de Trigo:**
   - Validada a presença e renderização dos assets de trigo (`farm_wheat.png` e `client/assets/agricultura/farm_wheat.png`), garantindo que a cadeia primária do trigo para farinha e panificação exiba o sprite correto no mapa mundi e nos modais.
6. **Layout Flexível Anti-Corte no Modal do Supermercado (`#store-modal`):**
   - Resolvido o corte inferior dos botões de ação e navegação que ocorria em resoluções menores ou após arrastar o modal.
   - Reestruturado o container modal com `max-h-[90vh] flex flex-col overflow-hidden` e área interna rolável `flex-1 overflow-y-auto`.
   - Aprimorado o utilitário `makeDraggable` para delimitar a altura máxima dinamicamente com base na posição vertical do topo (`maxHeight = calc(100vh - top - 1rem)`), garantindo que botões como "Contratar Gerente" e navegação de abas nunca fiquem fora da tela.
7. **Monitor Inteligente de Autonomia de Ração Animal:**
   - Implementado cálculo preditivo de consumo diário de ração/sementes para propriedades de pecuária (taxa base de 20% do volume de produção por ciclo).
   - Integrada busca em tempo real do estoque nas fazendas fornecedoras conectadas na rede da empresa.
   - Indicador visual dinâmico com badges semafóricos (🟢 Seguro >15d, 🟡 Atenção 5-15d, 🔴 Crítico <5d) e barra de progresso visual de dias de autonomia restante.
   - Enriquecido o modal de seleção de fornecedores de ração (`openFarmFeedSupplierModal`) com cartões exibindo estoque disponível e projeção de dias de suporte alimentar contínuo.
8. **Compilação e Verificação End-to-End via Chromium/Edge CDP:**
   - Executada compilação de produção com Vite 8 (`npm run build`), atualizando o bundle autônomo offline em `dist/index.html` e copiando todos os novos assets para `dist/assets/`.
   - Validados 100% dos testes da suíte automatizada headless (`tools/verify_browser_suite.ps1`), cobrindo busca de fazendas, cálculo de autonomia de ração e carregamento dos novos sprites.

---

### 📅 Sessão 12: A Grande Modularização da Engine (Vite 8, ES Modules, Tailwind CSS v4 Local Offline & Dev Server com HMR)
- **Data:** 04/09/2026 — 11:00
- **Versão Oficial:** `v0.8.4 (bld.20260904.01)` | **Save Schema:** `v0.8.2`
- **Autor / Pair Programming:** Jotasiete & Antigravity (AI Assistant)

#### 🎯 Entregas da Sessão (Fases 1 a 5 da Modularização):
1. **Fase 1 — Infraestrutura Vite 8 & Tailwind CSS v4 Local:**
   - Configuração do `vite.config.mjs` com `@tailwindcss/vite` e bundler Rollup gerando saída em formato IIFE autônomo (`inlineDynamicImports: true`).
   - Garantia de suporte universal duplo: execução direta pelo protocolo `file:///` para jogadores offline e dev server HTTP com HMR para desenvolvimento.
2. **Fase 2 — Modularização dos Dados Estáticos (`map_data.js` & `data_catalogs.js`):**
   - Extração de matrizes do mapa continental 128×128 (`MAP_WIDTH`, `MAP_HEIGHT`, `MAP_DATA`) e catálogos econômicos (`PRODUCT_CATALOG`, `RECIPES`, `STORE_TYPES`, `MEDIA_CHANNELS`, `RD_CATEGORIES`).
   - Exportações nativas ESM com retrocompatibilidade global em `window.*` para evitar quebras em scripts dependentes.
3. **Fase 3 — Modularização dos Subsistemas Procedurais (`sprite_manager.js` & `audio.js`):**
   - Conversão de `SpriteManager` e `SoundSystem` para classes/módulos ES Module com instâncias únicas (Singletons).
   - Auto-inicialização assíncrona tolerante a erros de carregamento e gestão centralizada de memória sonora.
4. **Fase 4A — Extração de Utilitários e Catálogos de UI (`logo_generator.js` & `game_config.js`):**
   - `logo_generator.js`: Funções puras de hashing determinístico (`hashStringToSeed`, `generateCompanyLogo`) para brasões e identicons corporativos em SVG.
   - `game_config.js`: Catálogos dos 24 avatares oficiais (`AVATAR_CATALOG`), predefinições de dificuldade (`DIFFICULTY_PRESETS`), paletas de cores (`COLOR_PALETTES`) e dicas econômicas.
5. **Fase 4B — Centralização do Estado Global & Persistência (`game_state.js` & `save_system.js`):**
   - `game_state.js`: Container `createInitialGameState()` atuando como Single Source of Truth do estado do jogo.
   - `save_system.js`: Pipeline de serialização e migração retroativa de saves (.oiko e localStorage), isolando `GAME_VERSION_INFO`, `migrateSaveData`, `getSavesIndex` e `saveSavesIndex`.
6. **Fase 5 & Integração — Desacoplamento de CDN & Novo Workflow de Execução:**
   - Criação de `client/style.css` com `@import "tailwindcss";`, compilando todas as classes utilitárias localmente sem depender do CDN do Tailwind.
   - Criação do script `JOGAR_DEV.bat` para iniciar o Vite Dev Server com recarregamento instantâneo em `http://localhost:5173/`.
   - Consolidação do `JOGAR.bat` apontando para o bundle autônomo compilado em `dist/index.html`.
   - Sincronização de boot do client via evento de ciclo de vida `oiko:ready` e tratamento de TDZ (Temporal Dead Zone) para `GAME_VERSION_INFO`.
7. **Validação & Testes E2E Automatizados:**
   - Suite automatizada via Chromium/Edge CDP headless testando os 6 pilares fundamentais da engine:
     1. Carregamento do canvas 128×128 e motor isométrico.
     2. Validação da cadeia produtiva e árvore de 77 receitas industriais.
     3. Inicialização e controle do subsistema de áudio (OikoFM).
     4. Janelas flutuantes arrastáveis e responsividade de modais.
     5. Pipeline de persistência, salvamento e migração de saves.
     6. Navegação de câmera WASD, zoom e minimapa radar.
   - 100% de aprovação em ambos os ambientes (`localhost:5173` e `dist/index.html`).

---

### 📅 Sessão 11: Sistema de Áudio Completo, Micro Rádio HUD, Síntese WAV e Otimização do Top HUD
- **Data:** 02/09/2026 — 20:30
- **Versão Oficial:** `v0.8.4 (bld.20260902.01)` | **Save Schema:** `v0.8.2`
- **Autor / Pair Programming:** Jotasiete & Antigravity (AI Assistant)

#### 🎯 Objetivos & Entregas Realizadas:
1. **Micro Rádio OikoFM no HUD Permanente (`#bottom-telemetry-bar`):**
   - Implementado widget interativo de rádio com botões `⏮ Volta`, `⏯ Tocar/Pausar`, `⏭ Pula`, `🔁/🔂 Loop de Faixa / Playlist Contínua` e `🔊/🔇 Mute Rápido`.
   - Display LCD com nome da faixa ativa e status de áudio.
2. **Controles de Volume Integrados no Menu de Pausa (ESC):**
   - Sliders diretos de Volume Geral (Master), Música (BGM), Ambiente (Cidade) e Efeitos Sonoros (SFX) integrados no `#pause-menu-modal` com sincronização reativa e persistência imediata em `localStorage`.
3. **Catálogo Oficial & Gestão de Memória de Áudio:**
   - Criado `docs/CATALOGO_DE_AUDIO.md` documentando 22 ativos de áudio.
   - Organizadas pastas em `client/assets/audio/` (BGM 1 a 7, Ambiente, SFX UI, Economia, Obras e Eventos).
   - Otimizado carregamento: priorizados arquivos `.mp3` para as faixas mais longas de BGM para evitar carregar arquivos `.wav` de 123MB/22MB na memória do navegador.
4. **Síntese de Efeitos Sonoros Nativos via PowerShell (.NET):**
   - Desenvolvido `tools/generate_sfx.ps1` utilizando síntese PCM direta em 16-bit 44.1kHz.
   - Gerados 8 arquivos WAV nativos reais: abertura de modais (`modal_open.wav`), carimbo contratual (`stamp_contract.wav`), tilintar de moedas (`coin_clink.wav`), crédito bancário (`loan_payout.wav`), demolição (`demolish.wav`), upgrade (`upgrade.wav`), alerta de perigo (`warning_alert.wav`) e notícia urgente (`news_flash.wav`).
5. **Otimização da Barra Superior (Top HUD) & Correção de Corte:**
   - Diagnosticado e corrigido o estouro horizontal que empurrava o botão **⚙️ Menu** e **⋯ Mais** para fora da viewport em telas < 1650px.
   - Removidos botões redundantes de zoom `- / Centro / +` do topo (zoom mantido via scroll do mouse, teclado Q/E e minimap).
   - Compactado o relógio para `04/09 · Ano 7` e o trimestre para `☀️ Q3 · Saturação` com tooltips ricos.
   - Adicionada classe prioritária `shrink-0` no botão **⚙️ Menu**.
6. **Silenciamento das Transições Mensais:**
   - Silenciado o auto-save mensal para evitar `playSuccessChime()` repetitivo a cada 30 dias.
   - Adicionado parâmetro `isSilent` em `saveGame()` mantendo o fluxo contínuo.

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

#### 📅 Sessão 06: Módulo Estratégico de P&D (Pesquisa & Desenvolvimento), Construção Física no Mapa, Mercado de Patentes & Zoom no Cursor
- **Data:** 28/08/2026 — 07:45
- **Versão Oficial:** `v0.8.0 (bld.20260828.02)` | **Save Schema:** `v0.8.0`

#### 🛠️ O Que Foi Implementado:
1. **Motor Matemático de P&D (`core_math.js`)**:
   - `CoreMath.calculateRDMonthlyCost(currentQR, categoryBaseCost)`: Custo mensal exponencial $C = C_{base} \times e^{2.5 \cdot (QR/100)}$.
   - `CoreMath.calculateRDQualityGain(currentQR, targetQR, monthlyBudget, baseMonthlyRequired)`: Ganho de QR com aceleração de verba (até 2.5x) e atenuação por rendimentos decrescentes $(1 - QR/120)$.
   - `CoreMath.propagateQualityToShelf(shelfQR, factoryQR, soldToday, shelfCapacity)`: Propagação gradual do QR da fábrica para a gôndola conforme o estoque antigo é consumido e reposto.
2. **Catálogos & Estruturas de Dados (`data_catalogs.js`)**:
   - Adicionado catálogo `RD_CATEGORIES` com custos base e ícones para 11 categorias de produtos.
   - Auto-população de `rdBaseCost` em todos os produtos do `PRODUCT_CATALOG`.
3. **Estado Global & Persistência (`index.html`)**:
   - Adicionado `rdLabs: {}` ao `GameState` e alias global.
   - Sanitização e migração retroativa em `migrateSaveData` e persistência total em `serializeCurrentGame` / `loadGameFromData`.
4. **Interface do Centro de P&D & Mercado de Patentes**:
   - `#rd-center-modal`: Janela arrastável com barra de orçamento mensal, status em tempo real e alternância entre abas de Projetos Ativos e Mercado de Patentes.
   - `#rd-new-project-modal`: Wizard com seleção de qualquer produto do catálogo, slider de QR alvo (60-100), input de verba mensal e estimativa de ETA/Custo Total em tempo real.
   - `buyCompetitorTech`: Aquisição direta de patentes de concorrentes com atualização imediata de linhas de produção.
5. **Integração com o Loop de Simulação & HUD**:
   - `propagateQualityRD()` executado diariamente dentro de `simulateDay()`.
   - `processRDProgress()` executado na virada mensal dentro de `closeMonthEnd()`.
   - Botão `🔬 P&D` com badge no Top HUD e chip na barra de telemetria.
   - Indicadores de P&D nos cards de linhas de montagem das fábricas e prateleiras das lojas.
6. **Zoom Ancorado no Cursor**:
   - `changeZoom` recalculando `camera.panX/panY` com pivô sob o ponteiro do mouse.

---

### 📅 Sessão 05: Sistema Universal de Janelas Arrastáveis, HUD Multi-Resolução & Gestão Imobiliária
- **Data:** 27/08/2026 — 19:20
- **Versão Oficial:** `v0.7.4 (bld.20260827.07)` | **Save Schema:** `v0.7.2`
- **Autor / Pair Programming:** Jotasiete & Antigravity (AI Assistant) *(Inovação de janelas móveis originada por Kaligola)*

#### 🎯 Objetivos:
- Assimilar a funcionalidade de janelas arrastáveis trazida pelo Kaligola, modernizando-a e integrando-a com foco dinâmico.
- Integrar a interface de **Venda e Demolição de Instalações** no rodapé dos painéis de gestão e telemetria rápida.
- Eliminar o erro vermelho do console (`Uncaught ReferenceError: pill is not defined`).
- Corrigir o problema de layout onde o topo colidia em laptops (1366x768 / 1280x720 / 125% DPI).
- Restabelecer o menu de construção interativo ao clicar em terrenos livres e atalhos rápidos na telemetria.
- Eliminar a duplicidade de minimapas sobrepostos.
- Estabelecer a regra oficial de versionamento `GAME_VERSION_INFO` SemVer 2.0 + Build Stamp.

---

### 📅 Sessão 04: Motor de Áudio Web Audio API Sintético
- **Data:** 27/08/2026
- **Versão:** `v0.7.3 (bld.20260827.04)`

---

### 📅 Sessão 03: Sparse Indexing O(k) & Otimização de Performance
- **Data:** 27/08/2026
- **Versão:** `v0.7.2 (bld.20260827.03)`

---

### 📅 Sessão 02: Pipeline de Saves e Migrações Retroativas
- **Data:** 27/08/2026
- **Versão:** `v0.7.1 (bld.20260827.02)`

---

### 📅 Sessão 01: Refatoração da Arquitetura Econômica & Cadeias Produtivas
- **Data:** 27/08/2026
- **Versão:** `v0.7.0 (bld.20260827.01)`