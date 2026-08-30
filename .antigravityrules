# PROTOCOLO DE CONTROLE DE EXECUÇÃO E FLUXO DE TRABALHO

Este documento estabelece as regras mandatórias de comportamento e controle de execução do agente no projeto **OIKONOMIA**.

---

## 1. Protocolo de Parada Rígida (`<PAUSE_FOR_USER_INPUT>`)

- **Validação e Confirmação de Escopo**:
  SEMPRE que você fizer uma pergunta de validação, confirmação de escopo ou pedir autorização para iniciar uma nova etapa/fase:
  - **NÃO** chame nenhuma ferramenta subsequente.
  - **NÃO** continue o raciocínio encadeado na mesma iteração.
  - Encerre sua resposta imediatamente emitindo a tag `<PAUSE_FOR_USER_INPUT>`.
  - Declare explicitamente que está aguardando a aprovação ou intervenção manual do usuário.

---

## 2. Inversão de Controle (Separação entre Planejamento e Execução)

- **Proibição de Execução Imediata após Proposta de Plano**:
  Se um plano de implementação, arquitetura técnica ou proposta de refatoração for apresentado ao usuário:
  - É **TERMINANTEMENTE PROIBIDO** executar ferramentas de modificação de código (`replace_file_content`, `write_to_file`) ou comandos de terminal de alteração na mesma mensagem.
  - Apresente o plano, emita `<PAUSE_FOR_USER_INPUT>` e pare imediatamente.
  - A execução só deve iniciar após a mensagem explícita de aprovação do usuário na iteração seguinte.

---

## 3. Compatibilidade com Stop Hooks e Loops Automáticos

- Respostas que aguardam decisão, escolha de opções ou autorização do usuário devem conter a tag `<PAUSE_FOR_USER_INPUT>` para que os hooks de ciclo de vida identifiquem a necessidade de pausa e retornem `exit 0` sem reinjeção automática de prompt.
