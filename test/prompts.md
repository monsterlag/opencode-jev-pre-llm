# Prompts de Teste — opencode-jev-pre-llm

> Teste manual no OpenCode para verificar se o plugin está funcionando corretamente.
> Execute em uma sessão OpenCode (`opencode --standalone --session test-plano`).

---

## 🔵 Prompts Determinísticos (JEV deve classificar → resposta curta, `temp=0`)

Estes são problemas com resposta única, objetiva, sem necessidade de raciocínio.
Se o plugin estiver funcionando, a resposta deve ser **curta**, sem explicação longa.

| # | Prompt | Resposta esperada (curta) | O que observar |
|---|---|---|---|
| 1 | `What is 2 + 2?` | `4` (apenas o número, sem "2 + 2 = 4" ou explicação) | Verificar se `[JEV PRE-ANALYSIS]` foi injetado no system |
| 2 | `What is the capital of France?` | `Paris` | Resposta direta, sem histórico ou contexto extra |
| 3 | `Calculate 15 divided by 3.` | `5` | Operação matemática simples |
| 4 | `Convert 100 Celsius to Fahrenheit.` | `212` (ou fórmula aplicada) | Conversão direta de unidades |
| 5 | `What is the square root of 144?` | `12` | Operação matemática simples |
| 6 | `How many characters in "hello"?` | `5` | Contagem direta |
| 7 | `What is 3 times 7?` | `21` | Multiplicação simples |

---

## 🟡 Prompts Quase Determinísticos (JEV pode classificar como determinístico — resposta curta mas com contexto)

Problemas com resposta única mas que podem exigir uma referência rápida.

| # | Prompt | Resposta esperada | Observação |
|---|---|---|---|
| 8 | `What is the atomic number of Carbon?` | `6` (talvez com referência) | Se determinístico, resposta curta |
| 9 | `What is the value of PI?` | `3.14159...` (truncado) | Se determinístico, apenas o número |
| 10 | `What year was the Declaration of Independence signed?` | `1776` | Data factual direta |

---

## 🟠 Prompts Não-Determinísticos (JEV NÃO deve classificar → LLM raciocina normalmente, resposta maior)

Estes problemas são subjetivos, exigem análise ou têm múltiplas respostas possíveis.
Se o plugin estiver funcionando corretamente, a resposta deve ser **maior**, com raciocínio visível.

| # | Prompt | O que observar |
|---|---|---|
| 11 | `What is the best programming language for web development?` | Resposta deve ser maior, comparando opções |
| 12 | `Should I learn Rust or Go for systems programming?` | Resposta com análise dos prós/contras |
| 13 | `How can I improve my code architecture?` | Resposta detalhada, com sugestões |
| 14 | `Explain the difference between a mutex and a semaphore.` | Explicação técnica longa |
| 15 | `Design a simple REST API for a blog.` | Resposta com estrutura, endpoints, etc. |

---

## 🔥 Testes Avançados (para confirmar que o plugin está ativo)

### Teste A: Verificar se o hook `context` está funcionando

Execute 2 prompts seguidos na mesma sessão:

```
# 1º turno
Prompt: "What is 2+2?"
# Esperado: resposta curta (4)

# 2º passo do mesmo turno (simulando continuação após tool)
# Se o plugin estiver funcionando, não deve chamar JEV novamente (cache)
Prompt: "Continue."
# Esperado: LLM continua normalmente (não deve injetar novamente)
```

### Teste B: Verificar se `.env` vazio (sem chave) deixa plugin inativo

```sh
# Temporariamente: renomear .env
mv .env .env.bak
echo "JEV_API_KEY=" > .env
# Reiniciar OpenCode
opencode service restart
# Enviar prompt: "What is 2+2?"
# Esperado: LLM raciocina normalmente (sem [JEV PRE-ANALYSIS])
# Restaurar: mv .env.bak .env
```

---

## 📝 Como Registrar Resultados

Ao testar, registre:

| Prompt | Tipo (D/N) | Resposta (curta/longa) | [JEV PRE-ANALYSIS] apareceu? | Notas |
|---|---|---|---|---|
| `What is 2+2?` | D | Curta (`4`) | ✅ | Plugin funcionando |
| `Best programming language?` | N | Longa | ❌ | LLM raciocinou normalmente |

Isso ajuda a confirmar que o plugin está ativo e funcionando corretamente.
