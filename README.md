# 🏛️ OIKONOMIA

**OIKONOMIA** é um simulador de estratégia econômica, logística e gestão corporativa profunda com motor de tempo contínuo e mapa urbano territorial isométrico 2D.

---

## 🌟 Recursos Principais (v0.3)

- 🗺️ **Mapa Isométrico 2D (36×36):** Bairros comerciais, residenciais, industriais, orla portuária e eixos viários com fluxo de pedestres e demografia real.
- 🏗️ **Wizard de Abertura de Lojas:** Escolha entre **Kombini** ($8k, 4 gôndolas), **Mercadinho** ($18k, 10 gôndolas) ou **Supermercado** ($45k, 25 gôndolas), montando seu próprio sortimento com custos de primeiro estoque.
- ⏱️ **Loop Temporal Contínuo:** Relógio com velocidades (Pausa [Espaço], 1x, 2x, 5x), escoamento diário de estoque e fechamento contábil mensal (DRE).
- 📊 **Microeconomia Rigorosa:** Curvas de elasticidade por índice de necessidade (*Necessity Index*), atratividade discreta quadrática e evolução de marca.
- 🤖 **IA Competitiva:** Concorrentes no mapa reagindo a variações de market share com guerra de preços.

---

## 🚀 Como Executar

### 1. Jogo Visual no Navegador
Basta dar duplo clique em:
```bash
JOGAR.bat
```

### 2. Suíte de Testes Automatizados (Console)
```bash
RODAR_TESTES.bat
```

### 3. Benchmark de 30 Dias (Console CLI)
```bash
SIMULAR_BENCHMARK.bat
```

---

## 📂 Estrutura de Diretórios

```
OIKONOMIA/
├── docs/                             # Documentos de Game Design (GDD, Fórmulas, Roadmap)
├── data/                             # Schemas JSON (Produtos, Cidades, Perfis de IA)
├── core/                             # Sim-Core Headless em TypeScript puro
│   ├── src/                          # Fórmulas de Rating, Elasticidade e Share
│   └── tests/                        # Testes unitários automatizados
├── client/                           # Cliente Visual Interativo (HTML5 Canvas 2D)
│   └── index.html
└── tools/                            # Ferramental e scripts de benchmark
```

---

## 📜 Licença
MIT License.
