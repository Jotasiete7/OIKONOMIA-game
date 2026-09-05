# 🏛️ OIKONOMIA — Diário dos Desenvolvedores (DevLog & Agenda Técnica)

> **Documento Oficial de Rastreabilidade, Versionamento e Evolução do Projeto**  
> **Repositório:** `Jotasiete7/OIKONOMIA-game`  
> **Última Atualização:** 05 de Setembro de 2026  
> **Versão Oficial Corrente:** `v0.8.4 (bld.20260905.01)`  
> **Save Schema:** `v0.8.2` (Compatibilidade Retroativa Total com Migrações)

---

## 🏷️ Padrão Oficial de Versionamento da Equipe (SemVer 2.0 + Build Stamp)

Todo o projeto segue estritamente a convenção:
$$\mathbf{vMAJOR}.\mathbf{MINOR}.\mathbf{PATCH}+\mathbf{bld.YYYYMMDD.XX}$$

- **MAJOR (v1.0.0, v2.0.0)**: Marcos definitivos de lançamento comercial / saída de Beta.
- **MINOR (v0.7.x -> v0.8.0 -> v0.9.0)**: Grandes módulos ou mecânicas novas (ex: P&D, QG Corporativo, frotas visuais).
- **PATCH (v0.8.3 -> v0.8.4)**: Pacotes de usabilidade, modularização, áudio, balanceamento e refinamentos de UI.
- **BUILD STAMP (`bld.YYYYMMDD.XX`)**: Carimbo diário com a data e o número da entrega daquele dia.
- **SAVE SCHEMA (`0.8.2`)**: Controla a compatibilidade dos saves `.oiko` e do `localStorage`.

---

## 🧭 Agenda de Desenvolvimento (Próximos Passos & Backlog Priorizado)

- [ ] **Fase 4 Contratos Públicos & Editais Municipais (v0.9.0)**: Fornecimento contínuo para prefeituras das 4 cidades com metas de quantidade, QR mínimo, bônus contratuais e multas por inadimplência.
- [ ] **Fase 4 Sistema Bancário & Financiamento Corporativo**: Empréstimos corporativos de giro e Capex amortizados mensalmente na DRE com taxas baseadas no Rating Corporativo (AAA a D).
- [ ] **Fase 5 Mercado Financeiro, Ações & M&A**: Ações corporativas, IPO, distribuição de dividendos, participações cruzadas e aquisições hostis (*Hostile Takeovers*).
- [ ] **QG Corporativo & Diretoria Executiva**: Sede global única com contratação de executivos (CEO, COO, CMO, CTO, CFO) provendo bônus setoriais de margem e pesquisa.
- [ ] **Módulo de Logística Visual**: Frotas de caminhões e navios com animação isométrica navegando pelas rodovias e rotas marítimas entre portos e cidades.
- [ ] **Fase 6 Dinâmica Macroeconômica & Clima**: Geadas, secas e safras recordes impactando o rendimento agropecuário; greves portuárias e flutuação de frete internacional.

---

## 📜 Histórico de Sessões & Registros de Evolução

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