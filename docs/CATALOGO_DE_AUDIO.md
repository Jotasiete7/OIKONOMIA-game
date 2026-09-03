# Catálogo Oficial de Áudio — OIKONOMIA

Este documento rastreia todos os ativos sonoros (Músicas, Ambientes e Efeitos Sonoros) suportados pelo motor de som de **OIKONOMIA** (`client/audio.js`), seu estado de implementação e sua função dentro da simulação.

> ⚠️ **Regra do Repositório:** Todos os arquivos de som são padronizados em **`.mp3`** em **`kebab-case`** (128 kbps para música/ambiente e 96 kbps para efeitos curtos). Arquivos `.wav` não comprimidos são proibidos no repositório.

---

## 📻 1. Músicas de Fundo (BGM - Background Music) — 128 kbps

| Identificador | Título / Clima | Caminho do Arquivo | Status | Formato / Tamanho |
| :--- | :--- | :--- | :---: | :--- |
| `bgm_1` | BGM 1 — Lounge Corporativo | `client/assets/audio/bgm/bgm-01.mp3` | ✅ Presente | MP3 / 2.39 MB |
| `bgm_2` | BGM 2 — Foco & Planejamento | `client/assets/audio/bgm/bgm-02.mp3` | ✅ Presente | MP3 / 7.42 MB |
| `bgm_3` | BGM 3 — Manhã Produtiva | `client/assets/audio/bgm/bgm-03.mp3` | ✅ Presente | MP3 / 142 KB |
| `bgm_4` | BGM 4 — Prosperidade | `client/assets/audio/bgm/bgm-04.mp3` | ✅ Presente | MP3 / 1.92 MB |
| `bgm_5` | BGM 5 — Estratégia de Mercado | `client/assets/audio/bgm/bgm-05.mp3` | ✅ Presente | MP3 / 1.22 MB |
| `bgm_6` | BGM 6 — Tensão & Negócios | `client/assets/audio/bgm/bgm-06.mp3` | ✅ Presente | MP3 / 411 KB |
| `bgm_7` | BGM 7 — Visão Global | `client/assets/audio/bgm/bgm-07.mp3` | ✅ Presente | MP3 / 660 KB |

*Modo de Execução:* O Micro Rádio executa as faixas em loop sequencial, com suporte a **Pular (⏭)**, **Voltar (⏮)**, **Repetir Faixa / Playlist (🔁/🔂)** e **Mute Rápido (🔇)**.

---

## 🏙 2. Paisagens Sonoras Ambientes (Ambience Loops) — 128 kbps

| Identificador | Descrição do Ambiente | Caminho do Arquivo | Status | Comportamento |
| :--- | :--- | :--- | :---: | :--- |
| `city` | Zumbido Urbano de Tráfego Geral | `client/assets/audio/ambience/ambience-low-traffic.mp3` | ✅ Presente | Loop contínuo de fundo (volume 20-40%) |
| `commercial` | Burburinho Comercial / Lojas | `client/assets/audio/ambience/commercial-hub-loop.mp3` | 🔄 Fallback | Reativo ao foco da câmera em lojas |
| `industrial` | Maquinário & Usinas | `client/assets/audio/ambience/industrial-zone-loop.mp3` | 🔄 Fallback | Reativo ao foco no polo industrial |
| `rural` | Vento nos Pastos & Fazendas | `client/assets/audio/ambience/rural-farm-loop.mp3` | 🔄 Fallback | Reativo ao foco no cinturão agrícola |
| `seaport` | Gaivotas & Cargueiros Portuários | `client/assets/audio/ambience/seaport-loop.mp3` | 🔄 Fallback | Reativo ao foco no porto comercial |

---

## ⚡ 3. Efeitos Sonoros (SFX - One-shots) — 96 kbps

| Subpasta | Arquivo | Função no Jogo | Status | Origem |
| :--- | :--- | :--- | :---: | :--- |
| `sfx/ui/` | `click.mp3` | Clique de botões, abas e seleção de filtros | ✅ Presente | Fornecido pelo Usuário |
| `sfx/ui/` | `modal-open.mp3` | Abertura de janelas, relatórios contábeis e modais | ✅ Presente | Convertido de Síntese PCM (.NET) |
| `sfx/ui/` | `stamp-contract.mp3` | Assinatura de licenças de franquia ou publicidade | ✅ Presente | Convertido de Síntese PCM (.NET) |
| `sfx/economy/` | `cash-register-low.mp3`| Conclusão de vendas e liquidação de estoque | ✅ Presente | Fornecido pelo Usuário |
| `sfx/economy/` | `coin-clink.mp3` | Pequenas movimentações de caixa e ajustes | ✅ Presente | Convertido de Síntese PCM (.NET) |
| `sfx/economy/` | `loan-payout.mp3` | Liberação de empréstimo ou aporte financeiro | ✅ Presente | Convertido de Síntese PCM (.NET) |
| `sfx/building/` | `hammer1.mp3` | Inauguração de estabelecimentos e início de obra | ✅ Presente | Fornecido pelo Usuário |
| `sfx/building/` | `demolish.mp3` | Demolição de lote ou desativação de instalação | ✅ Presente | Convertido de Síntese PCM (.NET) |
| `sfx/building/` | `upgrade.mp3` | Aumento de capacidade, automação e nível | ✅ Presente | Convertido de Síntese PCM (.NET) |
| `sfx/events/` | `great-win.mp3` | Fechamento de ano com lucro recorde (Celebração)| ✅ Presente | Fornecido pelo Usuário |
| `sfx/events/` | `win-01.mp3` / `win-02.mp3` | Meta batida, tutorial concluído, conquista | ✅ Presente | Fornecido pelo Usuário |
| `sfx/events/` | `apreensivo-blues-sfx.mp3` | Tensão no mercado, recessão, crise financeira | ✅ Presente | Fornecido pelo Usuário |
| `sfx/events/` | `warning-alert.mp3` | Alerta de estoque zerado, caixa negativo ou risco | ✅ Presente | Convertido de Síntese PCM (.NET) |
| `sfx/events/` | `news-flash.mp3` | Atualização urgente no Diário Corporativo / Ticker| ✅ Presente | Convertido de Síntese PCM (.NET) |

---

## 🛠️ 4. Padrão de Compressão de Novos Sons

Para converter novos arquivos de som antes de adicioná-los:
```bash
ffmpeg -i "novo_som.wav" -b:a 96k "client/assets/audio/sfx/categoria/novo-som.mp3"
```
Todos os novos arquivos colocados nas pastas correspondentes são automaticamente reconhecidos e reproduzidos pelo `SoundEngine` em `client/audio.js`.
