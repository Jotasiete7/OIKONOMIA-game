# 🏛️ OIKONOMIA — Simulador de Estratégia Econômica & Cadeia Produtiva

[![Engine](https://img.shields.io/badge/Engine-HTML5%20Canvas%20Isométrico-emerald.svg)](https://github.com/Jotasiete7/OIKONOMIA-game)
[![Map Scale](https://img.shields.io/badge/Escala%20do%20Mundo-128×128%20(16.384%20Tiles)-sky.svg)](https://github.com/Jotasiete7/OIKONOMIA-game)
[![Supply Chain](https://img.shields.io/badge/Cadeia%20Produtiva-63%2B%20Produtos%20%7C%2035%2B%20Receitas-amber.svg)](https://github.com/Jotasiete7/OIKONOMIA-game)
[![Architecture](https://img.shields.io/badge/UI-Tela%20Cheia%20%7C%20HUD%20Capitalism%20Lab-purple.svg)](https://github.com/Jotasiete7/OIKONOMIA-game)
[![License: Dual (MIT + Proprietary Assets)](https://img.shields.io/badge/License-Dual%20(MIT%20%2B%20Assets)-blue.svg)](LICENSE.md)

**OIKONOMIA** é um simulador econômico e empresarial profundo inspirado em clássicos como *Capitalism Lab*, *SimCity* e *Industry Giant*. O jogo combina um motor microeconômico de tempo contínuo com um vasto continente isométrico 2.5D de 128×128 blocos, integrando extração mineral, agropecuária, manufatura industrial, logística marítima e 8 redes especializadas de varejo.

---

## 🌟 Principais Recursos & Escalas do Jogo

### 🗺️ 1. Continente Isométrico de 128×128 (16.384 Tiles)
* **Geografia Costeira & Relevo Harmônico**: Praias naturais, águas profundas, colinas, cordilheiras e vales agrícolas férteis.
* **4 Cidades com Perfis Econômicos Reais**:
  - **🏛️ Nova Atenas (38, 38)**: Capital financeira e cultural de alta renda, com demanda por bens de luxo, moda e eletrônicos de alto QR.
  - **🚢 Porto Real (94, 38)**: O maior hub portuário e logístico do continente, situado na costa oceânica oriental com altíssimo volume de comércio.
  - **🏭 Montargis (38, 88)**: Polo industrial e siderúrgico no sudoeste, cercado por cordilheiras com ricos depósitos de ferro (*Desbloqueio: $500k de Patrimônio*).
  - **🌾 Várzea (88, 88)**: Vasto cinturão agropecuário nos vales férteis do sudeste (*Desbloqueio: 1 Fazenda ativa*).
* **Malha Rodoviária Suave & Pontes**: Autoestradas contínuas de pista dupla interligando todas as cidades e terminais portuários com pontes automáticas sobre a água.

---

### 🖥️ 2. Interface em Tela Cheia & Janelas Flutuantes (Estilo *Capitalism Lab*)
* **Canvas Edge-to-Edge**: O mapa ocupa 100% da janela do navegador sem barras de rolagem.
* **HUD Superior & Inferior Translúcido**: Controle fino com relógio contínuo, velocidades (`⏸ Pausa`, `1x`, `2x`, `5x`), saldo de caixa, lucro mensal, atalhos de cidades e lentes de calor (*Terreno, Tráfego, População, Varejo, Portos, Indústria, Mídia*).
* **🪟 Card Flutuante de Gestão**: Ao clicar em qualquer prédio (loja, fábrica, fazenda ou mina), uma janela flutuante elegante abre diretamente no canto direito sobre o mapa, sem rolagem.
* **📡 Radar Minimapa Interativo**: Renderização dedicada em tempo real com retângulo de visão da câmera e **teletransporte instantâneo por clique**.

---

### ⛓️ 3. Ecossistema de Cadeia de Suprimentos Completo (Vertical Integration)

```mermaid
graph LR
    subgraph 1. Extração & Agro
        M1[⛏️ Minas de Ferro]
        M2[🛢️ Poços de Petróleo]
        F1[🌾 Fazendas de Trigo]
        F2[🐑 Fazendas de Algodão / Pecuária]
    end

    subgraph 2. Manufatura & Beneficiamento
        IND1[⚙️ Moinho de Farinha]
        IND2[🍞 Panificação Artesanal]
        IND3[🧵 Tecelagem & Moda]
        IND4[💻 Siderurgia & Chips]
        IND5[🚗 Linha de Montagem Automotiva]
    end

    subgraph 3. Varejo Especializado
        RET1[🛒 Supermercados & Mercearias]
        RET2[👗 Lojas de Vestuário]
        RET3[📱 Tech Megastores]
        RET4[🚘 Concessionárias de Veículos]
    end

    M1 --> IND4
    M2 --> IND4
    F1 --> IND1 --> IND2 --> RET1
    F2 --> IND3 --> RET2
    IND4 --> IND5 --> RET4
    IND4 --> RET3
```

* **63+ Produtos de Consumo & Insumos Industriais**: Alimentos, bebidas, tecidos, eletrodomésticos, hardware, joias, materiais de construção e automóveis.
* **35+ Receitas Industriais**: Interface com abas por categoria (`[🌾 Alimentos]`, `[👗 Moda]`, `[💻 Tech]`, `[🚗 Veículos]`, `[⚙️ Base]`) e busca em tempo real.
* **Seletor de Fornecedores com Selos Coloridos**:
  - 👑 **SUA EMPRESA (PRODUÇÃO PRÓPRIA)**: Fornecimento direto de fábricas/fazendas próprias com **custo de produção direto e zero margem de intermediários**.
  - 🚢 **PORTO MARÍTIMO (IMPORTAÇÃO INTERNACIONAL)**: Terminais oceânicos de atacado global.
  - 🏪 **DISTRIBUIDOR REGIONAL**: Fornecedores independentes terceirizados.

---

### 💰 4. Mecânicas Imobiliárias e de Desinvestimento (*Capitalism Lab Formulas*)

| Ação | Fórmula de Cálculo | Resultado Econômico |
| :--- | :--- | :--- |
| **💰 Vender Instalação** | `(Custo_Obra × 70%) + (Estoque_Armazenado × Custo_Unitário)` | Credita o valor imediatamente no caixa, liquida o estoque a preço de custo e libera o lote. |
| **🗑️ Demolir Edifício** | `(Custo_Obra × 40%)` | Recupera o valor residual da sucata, remove a estrutura e zera o aluguel diário da terra. |

---

### 📰 5. Diário Corporativo & Ticker de Notícias em Tempo Real (Estilo Nasdaq / TortaApp)
* **Barra Fixa Superior com Aceleração por GPU**: Marquee contínuo com `translate3d` e velocidade linear configurável (30 a 90 px/s).
* **🖱️ Drag-to-Scroll Interativo**: Arraste a fita horizontalmente com o mouse para ler manchetes anteriores.
* **🎯 Jump to Latest**: Clique no badge do Diário para reiniciar o fluxo instantaneamente nas notícias mais recentes.
* **🔥 Smart Alert Pills**: Alertas de alta prioridade (marcos históricos, quebra de safras, choques de mercado e falências) com molduras iluminadas e ícones pulsantes.

---

### 🌐 6. Motor Macroeconômico & Sazonalidade dos 4 Trimestres (Estilo *Capitalism II*)
* **☀️ Sazonalidade Intra-ano (4 Trimestres de 90 dias)**:
  - **Q1 (Verão)**: +35% em bebidas e vestuário leve.
  - **Q2 (Outono)**: +25% de safra nas fazendas e panificação em alta.
  - **Q3 (Inverno)**: -20% de colheita no campo (entressafra), +40% em sopas, café, fármacos e agasalhos.
  - **Q4 (Festas)**: O Grande Trimestre de Compras (+45% em chocolates, carnes nobres e vestuário geral).
* **🏛️ Ciclos Macroeconômicos Decenais (10 Anos)**:
  - **🌱 Anos 1-2 (Retomada)**: PIB +5%, insumos estáveis.
  - **🔥 Anos 3-5 (Superaquecimento / Boom)**: Consumo +20%, insumos +15% (pressão de procura).
  - **⚠️ Anos 6-7 (Saturação)**: Desaceleração de vendas (-5%) e queima de estoques pela IA.
  - **📉 Anos 8-10 (Recessão & Liquidação / Value Investing)**: Consumo -20%, insumos no porto com -20% de desconto e patentes de concorrentes com **35% de desconto**!
* **📺 Central de Mídia & IBOPE Analytics**:
  - Pontos de IBOPE (0 a 100), alcance real em número de habitantes, CPRP (*Cost per Rating Point*) e barra de *Share of Voice* contra a concorrência.

---

## 🎮 Controles & Atalhos de Teclado

| Tecla / Comando | Ação |
| :--- | :--- |
| **`W` / `A` / `S` / `D`** ou **`Setas`** | Mover a câmera pelo mapa suavemente (60 FPS). |
| **`Scroll do Mouse`** ou **`Q` / `E`** | Zoom in / Zoom out. |
| **`Botão Esquerdo` (Arrastar)** | Panorâmica da câmera. |
| **`Clique no Lote / Prédio`** | Abrir janela flutuante de gestão ou wizard de construção. |
| **`Clique no Minimapa`** | Teletransportar a câmera diretamente para o ponto clicado. |
| **`Espaço`** | Pausar / Despausar o relógio da simulação. |
| **`Esc`** | Fechar janelas flutuantes, gavetas de DRE/Diário e abrir Configurações. |
| **`F`** | Ocultar/Restaurar painéis (Modo Teatro). |

---

## 🚀 Como Executar o Jogo

### 1. Execução Imediata (Windows)
Basta dar um duplo clique no inicializador:
```cmd
JOGAR.bat
```
*O jogo abrirá diretamente no seu navegador padrão com motor gráfico e mapas carregados.*

---

## 📂 Estrutura Modular do Projeto

```
OIKONOMIA/
├── client/
│   ├── index.html                 # Cliente completo com motor canvas 2D, HUD e modais
│   ├── core_math.js               # Motor matemático puro (elasticidade, ratings, P&D e trimestres)
│   ├── data_catalogs.js           # Catálogos estáticos de produtos, receitas, lojas e mídias
│   ├── ticker_system.js           # Módulo do Diário Corporativo / Ticker superior interativo
│   ├── macro_cycle_system.js      # Módulo macroeconômico de ciclos decenais de 10 anos
│   ├── sprite_manager.js          # Gerenciador e cache de texturas e sprites isométricos
│   ├── audio.js                   # Sistema de efeitos sonoros procedurais (Web Audio API)
│   └── map_data.js                # Camadas TMX e matrizes compiladas do continente
├── data/
│   ├── maps/                      # Mapas isométricos no formato Tiled
│   ├── cities/                    # Demografia e perfis socioeconômicos dos distritos
│   └── products/                  # Especificações técnicas e cadeias de insumos
├── docs/                          # Documentação, GDD e auditorias
└── JOGAR.bat                      # Inicializador de um clique
```

---

## 📜 Licença (Modelo Híbrido)

Este projeto adota um **modelo de licenciamento duplo**:
* **💻 Motor & Código-fonte:** Licenciado sob a licença permissiva **MIT**.
* **🎨 Modelos 3D, Sprites, Artes Visuais & Marca "OIKONOMIA":** **Todos os direitos reservados** (*All Rights Reserved* — Copyright © 2026). Proibida a redistribuição ou exploração comercial dos assets artísticos sem autorização expressa.

Consulte o arquivo [LICENSE.md](LICENSE.md) para os termos jurídicos completos.
