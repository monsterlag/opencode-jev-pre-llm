import type { Question } from "../jev/types"

/**
 * Fabrica as perguntas recomendadas para análise determinística.
 * Pode ser sobrescrito por `opencode.jsonc` options.
 */
export function buildQuestions(): Record<string, Question> {
  return {
    is_deterministic: {
      type: "noul",
      instructions:
        "Does this problem have a single, objectively correct answer that can be determined without reasoning (e.g., factual lookup, syntax fix, simple calculation, direct API call)?",
    },
    confidence: {
      type: "score",
      instructions:
        "How confident are you that this problem is fully deterministic?",
      criteria: [
        "Low — needs reasoning",
        "Medium — mostly deterministic",
        "High — fully deterministic",
      ],
    },
    suggested_answer: {
      type: "choice",
      instructions:
        "If fully deterministic, what is the direct answer? If reasoning needed, select 'needs_reasoning'.",
      criteria: {
        answer_provided: "Direct answer / lookup / syntax fix",
        needs_reasoning: "Requires LLM reasoning or multi-step analysis",
      },
    },
  }
}