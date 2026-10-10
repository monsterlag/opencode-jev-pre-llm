/**
 * Mapa efêmero de prompts admitidos por sessão.
 * Preenchido pelo hook `prompt` (1× por admissão),
 * consumido pelo hook `context` (a cada passo do agent loop).
 */
export interface PendingPrompt {
  text: string
  admittedAt: number
}

export class PendingPromptStore {
  private store = new Map<string, PendingPrompt>()

  add(sessionID: string, text: string, now = Date.now()): void {
    this.store.set(sessionID, { text, admittedAt: now })
  }

  take(sessionID: string): PendingPrompt | undefined {
    const entry = this.store.get(sessionID)
    if (!entry) return undefined
    this.store.delete(sessionID)
    return entry
  }

  peek(sessionID: string): PendingPrompt | undefined {
    return this.store.get(sessionID)
  }

  clear(): void {
    this.store.clear()
  }

  size(): number {
    return this.store.size
  }
}