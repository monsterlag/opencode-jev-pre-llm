/**
 * Política pura de decisão.
 * Entradas numéricas vindas do JEV + thresholds de config.
 * Saída: injeta instrução, passa normal, ou fail-open.
 */

export type DecisionAction = "inject" | "pass" | "failOpen"

export interface DecisionInput {
  isDeterministic: boolean
  noul: number
  confidence: number
  threshold: number
  minConfidence: number
}

export interface DecisionOutput {
  action: DecisionAction
  reason: string
}

/**
 * Regras:
 * - `noul >= threshold` E `score >= minConfidence` → injeta (determinístico confirmado)
 * - JEV respondeu mas abaixo do limiar → passa normal (LLM raciocina)
 * - Valores ausentes/inválidos (NaN, fora de domínio) → fail-open
 *
 * Função pura: sem I/O, sem estado, determinística.
 */
export function decide(input: DecisionInput): DecisionOutput {
  const { isDeterministic, noul, confidence, threshold, minConfidence } = input

  // Fail-open: valores ausentes ou inválidos
  if (
    typeof noul !== "number" ||
    Number.isNaN(noul) ||
    typeof confidence !== "number" ||
    Number.isNaN(confidence) ||
    typeof threshold !== "number" ||
    Number.isNaN(threshold) ||
    typeof minConfidence !== "number" ||
    Number.isNaN(minConfidence)
  ) {
    return {
      action: "failOpen",
      reason: "JEV returned invalid or missing values — letting LLM reason normally",
    }
  }

  const noulValid = noul >= 0 && noul <= 1
  const scoreValid = confidence >= 0 && confidence <= 2

  if (!noulValid || !scoreValid) {
    return {
      action: "failOpen",
      reason: `JEV values out of domain (noul=${noul}, score=${confidence}) — fail-open`,
    }
  }

  if (isDeterministic === false) {
    return {
      action: "pass",
      reason: "JEV explicitly says not deterministic — letting LLM reason",
    }
  }

  if (noul >= threshold && confidence >= minConfidence) {
    return {
      action: "inject",
      reason: `deterministic confirmed (noul=${noul} ≥ ${threshold}, score=${confidence} ≥ ${minConfidence})`,
    }
  }

  return {
    action: "pass",
    reason: `below threshold (noul=${noul} < ${threshold} or score=${confidence} < ${minConfidence}) — letting LLM reason`,
  }
}