# Inventário de Auditoria Pré-Limpeza de Áudio — OIKONOMIA

> **Data da Auditoria:** 02/09/2026 20:56:14  
> **Diretório Alvo:** \client/assets/audio/\  
> **Total de Arquivos:** 27  
> **Espaço Total Ocupado em Disco:** **236.33 MB** (247809443 bytes)

---

## 1. Resumo Executivo das Ineficiências

- **Total de Arquivos WAV não comprimidos:** 21 arquivos
- **Arquivos Duplicados (WAV + MP3/FLAC com mesmo nome base):** 2 casos
- **Arquivos WAV sem equivalente comprimido:** 19 arquivos
- **Arquivos com Nomes Irregulares (espaços, parênteses ou acentos):** 15 arquivos

---

## 2. Pares Duplicados (.wav + .mp3 / .flac)

| Nome Base | Arquivos Existentes | Tamanho Somado | Ação Necessária |
| :--- | :--- | :--- | :--- |
| `BGM (1)` | BGM (1).mp3 (2.39 MB) + BGM (1).wav (117.88 MB) | 120.27 MB | Manter 1x MP3 comprimido, deletar WAV duplicado |
| `BGM (2)` | BGM (2).mp3 (7.42 MB) + BGM (2).wav (21.54 MB) | 28.96 MB | Manter 1x MP3 comprimido, deletar WAV duplicado |

---

## 3. Arquivos WAV que Exigem Compressão para MP3

| Caminho Relativo | Tamanho | Categoria | Bitrate Recomendado |
| :--- | :--- | :--- | :--- |
| `client/assets/audio/bgm/BGM (3).wav` | 1.52 MB (1594700 bytes) | Música (BGM) | 128 kbps |
| `client/assets/audio/bgm/BGM (4).wav` | 34.58 MB (36254720 bytes) | Música (BGM) | 128 kbps |
| `client/assets/audio/bgm/BGM (5).wav` | 20.19 MB (21168044 bytes) | Música (BGM) | 128 kbps |
| `client/assets/audio/bgm/BGM (6).wav` | 6.64 MB (6959470 bytes) | Música (BGM) | 128 kbps |
| `client/assets/audio/bgm/BGM (7).wav` | 10.66 MB (11181696 bytes) | Música (BGM) | 128 kbps |
| `client/assets/audio/sfx/apreensivo blues sfx.wav` | 2.04 MB (2137808 bytes) | Efeito (SFX) | 96 kbps |
| `client/assets/audio/sfx/building/demolish.wav` | 0.04 MB (37088 bytes) | Efeito (SFX) | 96 kbps |
| `client/assets/audio/sfx/building/hammer1.wav` | 3.5 MB (3667954 bytes) | Efeito (SFX) | 96 kbps |
| `client/assets/audio/sfx/building/upgrade.wav` | 0.03 MB (33560 bytes) | Efeito (SFX) | 96 kbps |
| `client/assets/audio/sfx/economy/caixa registradora low.wav` | 1.48 MB (1557124 bytes) | Efeito (SFX) | 96 kbps |
| `client/assets/audio/sfx/economy/coin_clink.wav` | 0.02 MB (24740 bytes) | Efeito (SFX) | 96 kbps |
| `client/assets/audio/sfx/economy/loan_payout.wav` | 0.05 MB (48554 bytes) | Efeito (SFX) | 96 kbps |
| `client/assets/audio/sfx/events/great win.wav` | 1.74 MB (1825616 bytes) | Efeito (SFX) | 96 kbps |
| `client/assets/audio/sfx/events/news_flash.wav` | 0.02 MB (19448 bytes) | Efeito (SFX) | 96 kbps |
| `client/assets/audio/sfx/events/warning_alert.wav` | 0.03 MB (28268 bytes) | Efeito (SFX) | 96 kbps |
| `client/assets/audio/sfx/events/win (1).wav` | 0.96 MB (1001562 bytes) | Efeito (SFX) | 96 kbps |
| `client/assets/audio/sfx/events/win (2).wav` | 0.96 MB (1001562 bytes) | Efeito (SFX) | 96 kbps |
| `client/assets/audio/sfx/ui/modal_open.wav` | 0.01 MB (14156 bytes) | Efeito (SFX) | 96 kbps |
| `client/assets/audio/sfx/ui/stamp_contract.wav` | 0.02 MB (21212 bytes) | Efeito (SFX) | 96 kbps |

---

## 4. Arquivos com Nomes Irregulares (Espaços, Parênteses, Acentos)

| Nome Atual | Caminho | Problema Detectado | Sugestão Kebab-Case |
| :--- | :--- | :--- | :--- |
| `low traffic.mp3` | `client/assets/audio/ambience/low traffic.mp3` | Espaço | `low-traffic.mp3` |
| `BGM (1).mp3` | `client/assets/audio/bgm/BGM (1).mp3` | Espaço, Parênteses | `bgm-1.mp3` |
| `BGM (1).wav` | `client/assets/audio/bgm/BGM (1).wav` | Espaço, Parênteses | `bgm-1.mp3` |
| `BGM (2).mp3` | `client/assets/audio/bgm/BGM (2).mp3` | Espaço, Parênteses | `bgm-2.mp3` |
| `BGM (2).wav` | `client/assets/audio/bgm/BGM (2).wav` | Espaço, Parênteses | `bgm-2.mp3` |
| `BGM (3).wav` | `client/assets/audio/bgm/BGM (3).wav` | Espaço, Parênteses | `bgm-3.mp3` |
| `BGM (4).wav` | `client/assets/audio/bgm/BGM (4).wav` | Espaço, Parênteses | `bgm-4.mp3` |
| `BGM (5).wav` | `client/assets/audio/bgm/BGM (5).wav` | Espaço, Parênteses | `bgm-5.mp3` |
| `BGM (6).wav` | `client/assets/audio/bgm/BGM (6).wav` | Espaço, Parênteses | `bgm-6.mp3` |
| `BGM (7).wav` | `client/assets/audio/bgm/BGM (7).wav` | Espaço, Parênteses | `bgm-7.mp3` |
| `apreensivo blues sfx.wav` | `client/assets/audio/sfx/apreensivo blues sfx.wav` | Espaço | `apreensivo-blues-sfx.mp3` |
| `caixa registradora low.wav` | `client/assets/audio/sfx/economy/caixa registradora low.wav` | Espaço | `caixa-registradora-low.mp3` |
| `great win.wav` | `client/assets/audio/sfx/events/great win.wav` | Espaço | `great-win.mp3` |
| `win (1).wav` | `client/assets/audio/sfx/events/win (1).wav` | Espaço, Parênteses | `win-1.mp3` |
| `win (2).wav` | `client/assets/audio/sfx/events/win (2).wav` | Espaço, Parênteses | `win-2.mp3` |

---

## 5. Listagem Completa dos Arquivos Atuais (Estado 'Antes')

| Caminho | Extensão | Tamanho (Bytes) | Tamanho (Formatado) |
| :--- | :--- | :--- | :--- |
| `client/assets/audio/README.md` | .md | 4740 | 4.6 KB |
| `client/assets/audio/ambience/low traffic.mp3` | .mp3 | 2680109 | 2.56 MB |
| `client/assets/audio/bgm/BGM (1).mp3` | .mp3 | 2508089 | 2.39 MB |
| `client/assets/audio/bgm/BGM (1).wav` | .wav | 123608588 | 117.88 MB |
| `client/assets/audio/bgm/BGM (2).mp3` | .mp3 | 7780032 | 7.42 MB |
| `client/assets/audio/bgm/BGM (2).wav` | .wav | 22583296 | 21.54 MB |
| `client/assets/audio/bgm/BGM (3).wav` | .wav | 1594700 | 1.52 MB |
| `client/assets/audio/bgm/BGM (4).wav` | .wav | 36254720 | 34.58 MB |
| `client/assets/audio/bgm/BGM (5).wav` | .wav | 21168044 | 20.19 MB |
| `client/assets/audio/bgm/BGM (6).wav` | .wav | 6959470 | 6.64 MB |
| `client/assets/audio/bgm/BGM (7).wav` | .wav | 11181696 | 10.66 MB |
| `client/assets/audio/sfx/apreensivo blues sfx.wav` | .wav | 2137808 | 2.04 MB |
| `client/assets/audio/sfx/building/demolish.wav` | .wav | 37088 | 36.2 KB |
| `client/assets/audio/sfx/building/hammer1.wav` | .wav | 3667954 | 3.5 MB |
| `client/assets/audio/sfx/building/upgrade.wav` | .wav | 33560 | 32.8 KB |
| `client/assets/audio/sfx/economy/caixa registradora low.wav` | .wav | 1557124 | 1.48 MB |
| `client/assets/audio/sfx/economy/coin_clink.wav` | .wav | 24740 | 24.2 KB |
| `client/assets/audio/sfx/economy/loan_payout.wav` | .wav | 48554 | 47.4 KB |
| `client/assets/audio/sfx/events/great win.wav` | .wav | 1825616 | 1.74 MB |
| `client/assets/audio/sfx/events/news_flash.wav` | .wav | 19448 | 19 KB |
| `client/assets/audio/sfx/events/warning_alert.wav` | .wav | 28268 | 27.6 KB |
| `client/assets/audio/sfx/events/win (1).wav` | .wav | 1001562 | 978.1 KB |
| `client/assets/audio/sfx/events/win (2).wav` | .wav | 1001562 | 978.1 KB |
| `client/assets/audio/sfx/ui/click.flac` | .flac | 47119 | 46 KB |
| `client/assets/audio/sfx/ui/click.mp3` | .mp3 | 20188 | 19.7 KB |
| `client/assets/audio/sfx/ui/modal_open.wav` | .wav | 14156 | 13.8 KB |
| `client/assets/audio/sfx/ui/stamp_contract.wav` | .wav | 21212 | 20.7 KB |
