/**
 * Porta do classificador JEV (TypeSafe AI).
 * Permite injeção de dependência: implementações reais (HTTP) ou falsas (mock).
 */

export type QuestionType = "noul" | "choice" | "score"

export interface Question {
  type: QuestionType
  instructions: string
  criteria?: Record<string, string> | string[]
}

export interface QuestionAnswers {
  [key: string]: {
    type: QuestionType
    noul?: number
    choice?: string
    score?: number
    confidence?: number
    probabilities?: Record<string, number>
    legend?: Record<string, string>
  }
}

export interface SystemOneRequest {
  state: string
  model: string
  questions: Record<string, Question>
}

export interface SystemOneResponse {
  model: string
  answers: QuestionAnswers
  usage?: {
    input_tokens?: number
    output_tokens?: number
  }
}

export interface ClassifierResult {
  isDeterministic: boolean
  confidence: number
  suggestedAnswer?: string
  model: string
  usage?: { input_tokens?: number; output_tokens?: number }
}

export interface Classifier {
  classify(state: string, questions: Record<string, Question>): Promise<ClassifierResult>
}