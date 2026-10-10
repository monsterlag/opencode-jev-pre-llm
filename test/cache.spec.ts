import { describe, it, expect } from "vitest"
import { TTLCache } from "../src/cache"

function makeFakeClock() {
  let now = 1_000
  return {
    now: () => now,
    advance: (ms: number) => {
      now += ms
    },
  }
}

describe("TTLCache", () => {
  it("stores and retrieves values", () => {
    const clock = makeFakeClock()
    const cache = new TTLCache<string>(100, clock.now)
    cache.set("a", "hello")
    expect(cache.get("a")).toBe("hello")
  })

  it("returns undefined for missing keys", () => {
    const clock = makeFakeClock()
    const cache = new TTLCache<string>(100, clock.now)
    expect(cache.get("nope")).toBeUndefined()
  })

  it("expires entries after TTL", () => {
    const clock = makeFakeClock()
    const cache = new TTLCache<string>(100, clock.now)
    cache.set("a", "hello")
    clock.advance(101)
    expect(cache.get("a")).toBeUndefined()
  })

  it("returns value exactly at TTL boundary? no — expires at >= expiry", () => {
    const clock = makeFakeClock()
    const cache = new TTLCache<string>(100, clock.now)
    cache.set("a", "hello")
    clock.advance(99)
    expect(cache.get("a")).toBe("hello")
    clock.advance(1) // exatamente em 100ms
    expect(cache.get("a")).toBeUndefined()
  })

  it("overwrites value for same key", () => {
    const clock = makeFakeClock()
    const cache = new TTLCache<string>(100, clock.now)
    cache.set("a", "first")
    cache.set("a", "second")
    expect(cache.get("a")).toBe("second")
  })

  it("delete removes entry", () => {
    const clock = makeFakeClock()
    const cache = new TTLCache<string>(100, clock.now)
    cache.set("a", "hello")
    cache.delete("a")
    expect(cache.get("a")).toBeUndefined()
  })

  it("clear removes all entries", () => {
    const clock = makeFakeClock()
    const cache = new TTLCache<string>(100, clock.now)
    cache.set("a", "1")
    cache.set("b", "2")
    cache.clear()
    expect(cache.get("a")).toBeUndefined()
    expect(cache.get("b")).toBeUndefined()
  })

  it("size counts only non-expired entries", () => {
    const clock = makeFakeClock()
    const cache = new TTLCache<string>(100, clock.now)
    cache.set("a", "1")
    cache.set("b", "2")
    expect(cache.size()).toBe(2)
    clock.advance(101)
    expect(cache.size()).toBe(0)
  })
})