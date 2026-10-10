/**
 * Cache TTL mínimo, com clock injetado (DIP).
 * Usado para evitar chamadas repetidas ao JEV no mesmo turno.
 */
export interface CacheEntry<T> {
  value: T
  expiresAt: number
}

export class TTLCache<T> {
  private store = new Map<string, CacheEntry<T>>()

  constructor(
    private readonly ttlMs: number,
    private readonly clock: () => number = () => Date.now(),
  ) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key)
    if (!entry) return undefined

    if (this.clock() >= entry.expiresAt) {
      this.store.delete(key)
      return undefined
    }

    return entry.value
  }

  set(key: string, value: T): void {
    this.store.set(key, {
      value,
      expiresAt: this.clock() + this.ttlMs,
    })
  }

  delete(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }

  size(): number {
    // Limpa expirados ao medir
    const now = this.clock()
    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.expiresAt) this.store.delete(key)
    }
    return this.store.size
  }
}