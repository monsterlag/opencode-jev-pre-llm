import type {
  Classifier,
  ClassifierResult,
  Question,
  SystemOneRequest,
  SystemOneResponse,
} from "./types"

/**
 * Erro tipado para falhas do client JEV.
 */
export class JevError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly body?: string,
  ) {
    super(message)
    this.name = "JevError"
  }
}

/**
 * HTTP client para a API TypeSafe AI (`/v1/systemone`).
 * Suporta timeout via AbortSignal e falhas de rede.
 */
export class SystemOneClient implements Classifier {
  constructor(
    private readonly endpoint: string,
    private readonly apiKey: string,
    private readonly model: string,
    private readonly timeoutMs: number = 3000,
  ) {}

  async classify(
    state: string,
    questions: Record<string, Question>,
  ): Promise<ClassifierResult> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      const body: SystemOneRequest = {
        state,
        model: this.model,
        questions,
      }

      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      if (!response.ok) {
        const text = await response.text().catch(() => "")
        throw new JevError(
          `JEV API error: ${response.status} ${response.statusText}`,
          response.status,
          text,
        )
      }

      const json = (await response.json()) as SystemOneResponse

      return this.toClassifierResult(json)
    } catch (err) {
      if (err instanceof JevError) throw err
      if (err instanceof Error && err.name === "AbortError") {
        throw new JevError(`JEV request timed out after ${this.timeoutMs}ms`)
      }
      throw new JevError(`JEV network error: ${(err as Error).message}`)
    } finally {
      clearTimeout(timer)
    }
  }

  private toClassifierResult(resp: SystemOneResponse): ClassifierResult {
    const det = resp.answers?.is_deterministic
    const conf = resp.answers?.confidence

    return {
      isDeterministic: typeof det?.noul === "number" ? det.noul > 0 : false,
      confidence: typeof conf?.score === "number" ? conf.score : 0,
      suggestedAnswer: resp.answers?.suggested_answer?.choice,
      model: resp.model,
      usage: resp.usage,
    }
  }
}