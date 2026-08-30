# Relatório de Auditoria e Reauditoria do Grafo de Produção & Vínculos de Interface — OIKONOMIA

**Data da Auditoria:** 30 de Agosto de 2026  
**Ambiente:** Engine OIKONOMIA v0.8.1 (Build 20260828.03)  
**Metodologia:** Auditoria Automatizada (`tools/audit_production_graph.js`), Validador de Payback sem Piso (`tools/validate_market_balance.js`), Teste Funcional Determinístico de Vínculos (`tools/test_real_facility_links.js`) e Geração de Wiki Viva (`tools/generate_production_wiki.js`).

---

## SUMÁRIO EXECUTIVO

| Métrica do Sistema | Quantidade Catalogada | Status de Integridade |
|---|---|---|
| **Produtos no Catálogo Global** | 99 produtos | ✅ 100% integrados (Cadeia da Lã corrigida) |
| **Receitas Fabris de Manufatura** | 77 receitas | ✅ 100% integradas (Fiação + Tecelagem ativas) |
| **Minas Naturais Extrativas** | 7 minas | ✅ 100% integradas e extraíveis |
| **Fazendas & Pecuárias** | 14 fazendas | ✅ 100% integradas e cultiváveis |
| **Tipos de Lojas & Varejo** | 9 formatos comerciais | ✅ 100% mapeados com whitelists |
| **Ciclos / Dependências Circulares** | 0 ciclos | ✅ Grafo Direcionado Acíclico (DAG) Válido |
| **Violações no Grafo de Produção** | **0 violações** | ✅ **ALL PASS (`npm run audit-graph`)** |
| **Vínculos Comércio ↔ Fábrica ↔ P&D** | 4 sistemas testados | ✅ **100% Operacionais e Verificados** |

---

## PARTE 1 — Resolução Estrutural da Cadeia da Lã

A cadeia têxtil foi ajustada para operar em 2 estágios industriais autênticos:
$$\text{Lã de Ovelha (wool, Tier 0)} \xrightarrow{\text{Fiação (rec\_wool\_yarn)}} \text{Fio de Lã (wool\_yarn, Tier 1)} \xrightarrow{\text{Tecelagem (rec\_wool\_cloth)}} \text{Tecido de Lã (wool\_cloth, Tier 2)} \xrightarrow{\text{Confecção}} \text{Terno/Suéter/Vestido/Sofá (Tier 3)}$$

### Ações Executadas:
1. Inserido `wool_cloth` (Tecido de Lã) no `PRODUCT_CATALOG` (`isIntermediate: true`, `standardPrice: $16.00`, `baseCost: $8.50`).
2. Criada a receita fabril `rec_wool_yarn` (Fiação de Lã Natural, consumindo `wool` e gerando `wool_yarn`).
3. Conectada a receita `rec_wool_cloth` (Tecelagem de Lã Nobre) para consumir `wool_yarn` e produzir `wool_cloth`.
4. Mantidas as receitas `rec_suit`, `rec_sweater`, `rec_dress` e `rec_sofa` consumindo `wool_cloth` de forma nativa.
5. Inserido `wool_cloth` na tabela de importações do porto (`PORT_SUPPLIES_TECH_PARTS`).

**Resultado (`npm run audit-graph`):** **0 violações encontradas.**

---

## PARTE 2 — Validação de Payback e Equilíbrio sem Piso Artificial

Removido o piso forçado `Math.max(0.35, ...)` em `tools/validate_market_balance.js`. Todos os caminhos foram padronizados com `path.resolve(__dirname, ...)` e o comando `npm run validate-balance` foi integrado ao `package.json`.

### 1. Payback por Formato de Loja (Cesta Cheia em Distrito Médio)

| Formato de Loja | Slots | Capex Inicial | Lucro Líquido / Mês | Payback Estimado | Status de Equilíbrio |
|---|---|---|---|---|---|
| **Kombini de Bairro** | 4 | $8.794 | +$9.324 | **0.9 meses** | ⚠️ Muito Rápido (Conveniência Inicial) |
| **Supermercado & Alimentos** | 10 | $47.054 | +$14.997 | **3.1 meses** | ⚠️ Rápido |
| **Boutique de Vestuário & Moda** | 6 | $49.599 | +$9.225 | **5.4 meses** | ✅ **EQUILIBRADO** |
| **MegaStore de Eletrônicos** | 6 | $116.615 | +$42.256 | **2.8 meses** | ⚠️ Rápido |
| **Concessionária de Automóveis** | 4 | $336.810 | +$141.508 | **2.4 meses** | ⚠️ Rápido |
| **Drogaria & Cosméticos** | 6 | $29.426 | +$3.480 | **8.5 meses** | ✅ **EQUILIBRADO** |
| **Loja de Móveis & Decoração** | 5 | $59.773 | +$16.215 | **3.7 meses** | ⚠️ Rápido |
| **Joalheria de Alta Nobreza** | 3 | $94.942 | +$12.569 | **7.6 meses** | ✅ **EQUILIBRADO** |
| **Home Center & Ferramentas** | 5 | $41.380 | -$2.107 | **$\infty$ (Prejuízo)** | ⚠️ Lento / Prejuízo |

### 2. Achado Legítimo: Commodities / Matérias-Primas com Margem Unitária Negativa no Varejo

A remoção do piso revelou que se um jogador colocar **matérias-primas brutas** diretamente na gôndola do varejo com o markup padrão de atacado, elas geram margem negativa (pois o preço padrão de catálogo é de atacado/commodities, não de varejo fracionado):
* `wheat` (Trigo): Preço $0.80 vs Landed $0.81 (Margem: -$0.01/un)
* `corn` (Milho): Preço $0.70 vs Landed $0.72 (Margem: -$0.02/un)
* `cotton` (Algodão): Preço $2.00 vs Landed $2.15 (Margem: -$0.15/un)
* `iron_ore` (Minério de Ferro): Preço $25.00 vs Landed $26.91 (Margem: -$1.91/un)
* `crude_oil` (Petróleo): Preço $36.00 vs Landed $39.47 (Margem: -$3.47/un)
* `gold_ore` (Minério de Ouro): Preço $190.00 vs Landed $215.28 (Margem: -$25.28/un)

*(Recomendação para a próxima sessão: Manter matérias-primas estritamente como insumos industriais ou ajustar os preços de gôndola no varejo).*

---

## PARTE 3 — Reauditoria Real dos Vínculos Comércio ↔ Indústria ↔ P&D

Executada via `tools/test_real_facility_links.js` com verificação de transições de estado reais no ecossistema:

### Teste 1: Modal de Adicionar Produto na Loja (`add-product-modal`)
* **Passo a passo**: Criada uma Drogaria em `(15, 15)`. Aberta a lista de candidatos.
* **Resultado Real**:
  * Whitelist de farmácia filtra com precisão estrita: `Farmácia`, `Higiene` e `Cosméticos`.
  * Itens de outras categorias (`economy_car`, `jeans`) são bloqueados com sucesso.
  * Inserção do remédio `cold_pills` gerou a gôndola ativa com Preço=$9.50, Fornecedor=Porto Alfa e Custo Landed=$3.74.

### Teste 2: Modal de Fornecedores de Insumos (`supplier-modal`) na Fábrica
* **Passo a passo**: Criada Pecuária Leiteira em `(20, 20)` e Usina de Laticínios em `(24, 20)`. Aberto o modal de fornecedor de `raw_milk`.
* **Resultado Real**:
  * Modal lista 3 ofertas reais (Fazenda Própria + 2 Portos Internacionais).
  * Conexão da Fazenda Própria recalculou o frete Manhattan ($4 \text{ tiles} = \$0.04$) e o custo unitário da fábrica para $\$0.63$/un.
  * No ciclo diário, o silo da fazenda reduziu de $2.000 \rightarrow 1.550$ un e o estoque de leite na fábrica subiu de $0 \rightarrow 450$ un de forma consistente.

### Teste 3: Wizard de P&D (`rd-new-project-modal`) ↔ Fábrica
* **Passo a passo**: Avaliado o produto `business_suit` (Terno Executivo, Tier 3).
* **Resultado Real**:
  * Tiers calculados com precisão: `wool` (Tier 0), `wool_yarn` (Tier 1), `wool_cloth` (Tier 2), `business_suit` (Tier 3).
  * Pesquisa de `business_suit` adiciona o ID a `unlockedTechSet`.
  * Na fábrica, a receita `rec_suit` é imediatamente liberada para ativação sem necessidade de recarregar a tela.

### Teste 4: Árvore Tecnológica (`tech-tree-modal`) ↔ Catálogo
* **Passo a passo**: Reconstrução genealógica das cadeias completas.
* **Resultado Real**:
  * Pão: `wheat (Tier 0) ➔ flour (Tier 1) ➔ bread (Tier 2)`.
  * Terno: `wool (Tier 0) ➔ wool_yarn (Tier 1) ➔ wool_cloth (Tier 2) ➔ business_suit (Tier 3)`.
  * Automóvel: Cadeia multi-ramos com cálculo exato de bônus de convergência.

---

## COMANDOS E RECURSOS DISPONÍVEIS

* `npm run audit-graph`: Executa a auditoria das 7 regras do grafo (`tools/audit_production_graph.js`).
* `npm run validate-balance`: Executa a validação de paybacks e margens unitárias (`tools/validate_market_balance.js`).
* `npm run generate-wiki`: Regenera a wiki viva em `docs/wiki/producao.md` (`tools/generate_production_wiki.js`).
