# 🗺️ Roadmap de Desenvolvimento — OIKONOMIA

**Versão Atual**: `v0.8.2 (Build 20260831.01)`  
**Status da Infraestrutura**: 100% Validada em Navegador Real via Protocolo CDP (Edge Headless) com Evidências Visuais Capturadas.

---

## 📊 Matriz de Fases & Status de Desenvolvimento

| Fase | Escopo | Entregáveis Principais | Status |
| :--- | :--- | :--- | :--- |
| **Fase 1** | **Sim-Core & Fundamentos Econômicos** | Motor temporal contínuo (Ticks/Dias/Meses), cálculo de atratividade quadrática de clientes, curvas de elasticidade de preço, gôndolas de varejo, contabilidade gerencial e DRE mensal automatizada. | ✅ **Concluída** |
| **Fase 2** | **Cadeia Produtiva Integrada (Supply Chain & P&D)** | 14 culturas agrícolas, 7 jazidas minerais, 77 receitas industriais, 99 produtos catalogados. Sistema de P&D com Curva Assintótica (Tech Levels 1 a 5), Árvore Tecnológica de 249 nós e desbloqueio *in-place*. | ✅ **Concluída** |
| **Fase 3** | **Macro-Mundo 128×128 & Interface Capitalism Lab** | Mapa continental isométrico 128×128 com 4 metrópoles (Nova Atenas, Porto Real, Montargis, Várzea), portos mercantes, janelas flutuantes com arrasto, minimapa radar, câmera WASD e zoom suave. | ✅ **Concluída** |
| **Fase 3.5** | **Balanceamento de Nicho & Enciclopédia In-Game** | Payback corrigido para todos os 9 formatos comerciais (4 a 18 meses) via Licenças de Nicho. Enciclopédia Corporativa in-game (`F1` e botões `📖 Wiki`) com 7 abas funcionais e calculadora industrial de insumos. | ✅ **Concluída** |
| **Fase 4** | **Contratos Públicos, Editais & Sistema Bancário** | Editais governamentais de suprimento municipal (merenda escolar, obras públicas, frota municipal). Linhas de crédito bancário com taxas de juros mensais, debêntures e dívida de longo prazo. | ⏳ **Planejada (Próxima)** |
| **Fase 5** | **Mercado Financeiro, Bolsa de Valores & M&A** | Ações corporativas, IPO do jogador e de rivais, dividendos trimestrais, participações cruzadas, aquisições hostis de concorrentes (*Hostile Takeovers*) e holdings empresariais. | ⏳ **Planejada** |
| **Fase 6** | **Dinâmica Macroeconômica, Clima & Sazonalidade** | Geadas, secas e safras recordes impactando rendimento agropecuário; greves portuárias e flutuação de frete internacional; picos sazonais de consumo (Black Friday, Natal, Festivais). | ⏳ **Planejada** |
| **Fase 7** | **Polimento Audiovisual, Sprites & Sound FX** | Expansão do catálogo de sprites isométricos, efeitos de fumaça fabril/tráfego, trilha sonora dinâmica por estação/cidade e áudio de feedback contábil. | ⏳ **Planejada** |

---

## 🎯 Detalhamento dos Próximos Passos (Fase 4 — Backlog Imediato)

### 1. Editais de Contratos Governamentais (B2G Supply Contracts)
- **Mecânica**: Prefeituras das 4 cidades publicam editais no início de cada trimestre com prazos e quantidades fixas de entrega (ex: *Fornecer 10.000 un de Remédios/Mês para a Secretaria de Saúde de Porto Real por $3.50/un + Bônus de Cumprimento de $50.000*).
- **Penalidades**: Multa contratual diária por inadimplência ou quebra de qualidade mínima (QR exigido no edital).

### 2. Sistema Bancário & Financiamento Corporativo (Loans & Debt)
- **Empréstimo de Capital de Giro**: Curto prazo (6–12 meses) com juros amortizados diretamente no fechamento contábil mensal da DRE.
- **Financiamento de Expansão (BNDES/Capex)**: Longo prazo para construção de grandes complexos industriais com garantia real sobre os terrenos da corporação.
- **Rating de Crédito Corporativo (AAA até D)**: Avaliação de solvência e alavancagem financeira que determina a taxa de juros oferecida pelos bancos da metrópole.

---

## 🛡️ Ferramental de Confiabilidade & Auditoria Contínua
- `npm run audit-browser`: Executa o Microsoft Edge headless via DevTools Protocol testando os modais, a whitelist de produtos, a árvore de tecnologia, o licenciamento de nicho e a enciclopédia interativa.
- `npm run audit-deep`: Executa 365 ticks de simulação contínua com verificação de DRE, tráfego intermunicipal, campanhas de mídia, IA de concorrência com guerra de preços e integridade de Save/Load.
- `npm run audit-graph`: Valida matematicamente a árvore de 77 receitas industriais, garantindo ausência de nós órfãos ou loops recursivos.

---

## 🔬 Consultorias & Roadmaps Setoriais Arquivados
- **[Diagnóstico de Causalidade & Ferramentas de Inteligência Econômica](consultoria/2026-08-31_ROADMAP_DIAGNOSTICO_E_CAUSALIDADE.md)**: Análise aprofundada das 14 ideias de diagnóstico (Analista Corporativo, Botão "Por quê?", DRE Interativa, Simulador "E se?", etc.) com matriz de viabilidade e arquitetura de séries temporais.
- **[Consultoria de Arquitetura & Transição Modular v0.7](consultoria/2026-08-27_consultoria_arquitetura_v0.7.md)**: Diretrizes de modularização, separação de concerns e migração TypeScript.

