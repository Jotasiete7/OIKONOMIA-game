# Especificação Matemática do Motor Econômico de OIKONOMIA

Este documento descreve formalmente as equações que regem o simulador microeconômico de **OIKONOMIA**.

---

## 1. Product Overall Rating (0–100)

O rating geral de atratividade de um produto em um ponto de venda é uma média ponderada dos três pilares clássicos de consumo:

$$W_{\text{preço}} = 100 - (W_{\text{qualidade}} + W_{\text{marca}})$$

$$\text{Price Rating} = \text{clamp}\left(50 \times \frac{P_{\text{standard}}}{P_{\text{venda}}}, 0, 100\right)$$

$$\text{Overall Rating} = \frac{(\text{QR} \times W_{\text{qualidade}}) + (\text{BR} \times W_{\text{marca}}) + (\text{Price Rating} \times W_{\text{preço}})}{100}$$

---

## 2. Elasticidade de Preço via Necessity Index

O índice de essencialidade do bem (`necessityIndex`, $N \in [0, 100]$) controla o expoente de elasticidade-preço da demanda:

$$\gamma(N) = 2.20 - 1.85 \times \left(\frac{N}{100}\right)$$

$$\text{Fator Elasticidade} = \left(\frac{P_{\text{standard}}}{P_{\text{venda}}}\right)^{\gamma(N)}$$

- Para $N = 85$ (Bens Essenciais como Pão/Leite): $\gamma = 0.6275$ (Demanda Inelástica).
- Para $N = 30$ (Bens Supérfluos como Cerveja Especial): $\gamma = 1.6450$ (Demanda Altamente Elástica).

---

## 3. Demanda Territorial por Quarteirão

Para cada quarteirão ou distrito $k$:

$$\text{Demanda Base} = \text{População}_k \times \text{Consumo Per Capita} \times \left(\frac{\text{Traffic Index}_k}{100}\right) \times \text{Ruído Sazonal}$$

$$\text{Demanda Potencial do Produto} = \text{Demanda Base} \times \text{Fator Elasticidade}$$

---

## 4. Market Share por Atratividade Quadrática (Discrete Choice)

$$\text{Atratividade}_{\text{Jogador}} = \text{Overall Rating}_{\text{Jogador}}^{2}$$
$$\text{Atratividade}_{\text{IA}} = \text{Overall Rating}_{\text{IA}}^{2}$$
$$\text{Atratividade}_{\text{Informal}} = 25^{2} = 625$$

$$\text{Market Share}_{\text{Jogador}} = \frac{\text{Atratividade}_{\text{Jogador}}}{\text{Atratividade}_{\text{Jogador}} + \text{Atratividade}_{\text{IA}} + \text{Atratividade}_{\text{Informal}}}$$

$$\text{Vendas Efetivas} = \min(\text{Estoque em Gôndola}, \lfloor \text{Demanda Potencial} \times \text{Market Share}_{\text{Jogador}} \rfloor)$$
