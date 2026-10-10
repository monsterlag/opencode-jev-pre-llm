import type { DecisionAction } from "../analysis/decision"

/**
 * Instrução injetada no system prompt quando a análise JEV
 * confirma que o problema é determinístico.
 */
export function buildInjectionMessage(reason: string): string {
  return [
    "[JEV PRE-ANALYSIS]",
    `A pre-analysis (JEV) classified this request as deterministic (${reason}).`,
    "Instructions:",
    "- Respond DIRECTLY and CONCISELY. Do not perform extended reasoning.",
    "- Do not explore multiple hypotheses or alternatives.",
    "- If the answer requires a tool call (e.g., reading a file), make it immediately without deliberation.",
    "- Keep the response as short as the task allows.",
  ].join("\n")
}

export interface InjectionOptions {
  temperature: number
  maxTokens: number
}

export function buildInjectionOptions(maxTokens: number): InjectionOptions {
  return {
    temperature: 0,
    maxTokens,
  }
}

export type { DecisionAction }