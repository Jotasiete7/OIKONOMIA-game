# Catálogo Oficial de Áudio — OIKONOMIA

Este documento rastreia todos os ativos sonoros (Músicas, Ambientes e Efeitos Sonoros) suportados pelo motor de som de **OIKONOMIA** (`client/audio.js`), seu estado de implementação e sua função dentro da simulação.

---

## 📻 1. Músicas de Fundo (BGM - Background Music)

| Identificador | Título / Clima | Caminho do Arquivo | Status | Formato / Tamanho |
| :--- | :--- | :--- | :---: | :--- |
| `bgm_1` | BGM 1 — Lounge Corporativo | `client/assets/audio/bgm/BGM (1).mp3` | ✅ Presente | MP3 / 2.5 MB *(Priorizado vs WAV 123MB)* |
| `bgm_2` | BGM 2 — Foco & Planejamento | `client/assets/audio/bgm/BGM (2).mp3` | ✅ Presente | MP3 / 7.7 MB *(Priorizado vs WAV 22MB)* |
| `bgm_3` | BGM 3 — Manhã Produtiva | `client/assets/audio/bgm/BGM (3).wav` | ✅ Presente | WAV / 1.5 MB |
| `bgm_4` | BGM 4 — Prosperidade | `client/assets/audio/bgm/BGM (4).wav` | ✅ Presente | WAV / 36.2 MB |
| `bgm_5` | BGM 5 — Estratégia de Mercado | `client/assets/audio/bgm/BGM (5).wav` | ✅ Presente | WAV / 21.1 MB |
| `bgm_6` | BGM 6 — Tensão & Negócios | `client/assets/audio/bgm/BGM (6).wav` | ✅ Presente | WAV / 6.9 MB |
| `bgm_7` | BGM 7 — Visão Global | `client/assets/audio/bgm/BGM (7).wav` | ✅ Presente | WAV / 11.1 MB |

*Modo de Execução:* O Micro Rádio executa as faixas em loop sequencial, com suporte a **Pular (⏭)**, **Voltar (⏮)**, **Repetir Faixa / Playlist (🔁/🔂)** e **Mute Rápido (🔇)**.

---

## 🏙 2. Paisagens Sonoras Ambientes (Ambience Loops)

| Identificador | Descrição do Ambiente | Caminho do Arquivo | Status | Comportamento |
| :--- | :--- | :--- | :---: | :--- |
| `city` | Zumbido Urbano de Tráfego Geral | `client/assets/audio/ambience/low traffic.mp3` | ✅ Presente | Loop contínuo de fundo (volume 20-40%) |
| `commercial` | Burburinho Comercial / Lojas | `client/assets/audio/ambience/commercial_hub_loop.mp3` | 🔄 Fallback | Reativo ao foco da câmera em lojas |
| `industrial` | Maquinário & Usinas | `client/assets/audio/ambience/industrial_zone_loop.mp3` | 🔄 Fallback | Reativo ao foco no polo industrial |
| `rural` | Vento nos Pastos & Fazendas | `client/assets/audio/ambience/rural_farm_loop.mp3` | 🔄 Fallback | Reativo ao foco no cinturão agrícola |
| `seaport` | Gaivotas & Cargueiros Portuários | `client/assets/audio/ambience/seaport_loop.mp3` | 🔄 Fallback | Reativo ao foco no porto comercial |

---

## ⚡ 3. Efeitos Sonoros (SFX - One-shots)

| Subpasta | Arquivo | Função no Jogo | Status | Origem |
| :--- | :--- | :--- | :---: | :--- |
| `sfx/ui/` | `click.mp3` | Clique de botões, abas e seleção de filtros | ✅ Presente | Fornecido pelo Usuário |
| `sfx/ui/` | `modal_open.wav` | Abertura de janelas, relatórios contábeis e modais | ✅ Presente | Síntese PCM Nativa (.NET) |
| `sfx/ui/` | `stamp_contract.wav` | Assinatura de licenças de franquia ou publicidade | ✅ Presente | Síntese PCM Nativa (.NET) |
| `sfx/economy/` | `caixa registradora low.wav`| Conclusão de vendas e liquidação de estoque | ✅ Presente | Fornecido pelo Usuário |
| `sfx/economy/` | `coin_clink.wav` | Pequenas movimentações de caixa e ajustes | ✅ Presente | Síntese PCM Nativa (.NET) |
| `sfx/economy/` | `loan_payout.wav` | Liberação de empréstimo ou aporte financeiro | ✅ Presente | Síntese PCM Nativa (.NET) |
| `sfx/building/` | `hammer1.wav` | Inauguração de estabelecimentos e início de obra | ✅ Presente | Fornecido pelo Usuário |
| `sfx/building/` | `demolish.wav` | Demolição de lote ou desativação de instalação | ✅ Presente | Síntese PCM Nativa (.NET) |
| `sfx/building/` | `upgrade.wav` | Aumento de capacidade, automação e nível | ✅ Presente | Síntese PCM Nativa (.NET) |
| `sfx/events/` | `great win.wav` | Fechamento de ano com lucro recorde (Celebração)| ✅ Presente | Fornecido pelo Usuário |
| `sfx/events/` | `win (1).wav` / `(2).wav` | Meta batida, tutorial concluído, conquista | ✅ Presente | Fornecido pelo Usuário |
| `sfx/events/` | `apreensivo blues sfx.wav` | Tensão no mercado, recessão, crise financeira | ✅ Presente | Fornecido pelo Usuário |
| `sfx/events/` | `warning_alert.wav` | Alerta de estoque zerado, caixa negativo ou risco | ✅ Presente | Síntese PCM Nativa (.NET) |
| `sfx/events/` | `news_flash.wav` | Atualização urgente no Diário Corporativo / Ticker| ✅ Presente | Síntese PCM Nativa (.NET) |

---

## 🛠️ 4. Como Recriar ou Adicionar Novos Sons

Para regerar os arquivos sintetizados nativos:
```powershell
powershell -ExecutionPolicy Bypass -File tools/generate_sfx.ps1
```
Todos os novos arquivos colocados nas pastas correspondentes são automaticamente reconhecidos e reproduzidos pelo `SoundEngine` em `client/audio.js`.
