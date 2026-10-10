import fs from "node:fs"
import path from "node:path"
import os from "node:os"

export type DotEnvValues = Record<string, string>

/**
 * Parser mínimo de .env, sem dependências externas.
 * - `KEY=value`, `KEY="value"`, `KEY='value'`, `export KEY=value`
 * - linhas de comentário (`#`), vazias e inline comments ignoradas
 * - valores duplamente aspas/simples são unescapados
 * - primeira ocorrência de uma chave vence (primeiro wins)
 *
 * @param content - string crua do arquivo .env
 */
export function parseDotEnv(content: string): DotEnvValues {
  const result: DotEnvValues = {}

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()

    if (trimmed === "" || trimmed.startsWith("#")) continue

    // Remove prefix `export ` se presente
    const withoutExport = trimmed.startsWith("export ") ? trimmed.slice(7) : trimmed

    const eq = withoutExport.indexOf("=")
    if (eq === -1) continue

    let key = withoutExport.slice(0, eq).trim()
    let value = withoutExport.slice(eq + 1).trim()

    // Remove inline comments (apenas se não estão dentro de aspas simples/dobras)
    let inQuotes = false
    let quoteChar = ""
    let commentIndex = -1

    for (let i = 0; i < value.length; i++) {
      const ch = value[i]
      if (!inQuotes && (ch === '"' || ch === "'")) {
        inQuotes = true
        quoteChar = ch
        continue
      }
      if (inQuotes && ch === quoteChar) {
        inQuotes = false
        quoteChar = ""
        continue
      }
      if (!inQuotes && ch === "#") {
        commentIndex = i
        break
      }
    }

    if (commentIndex !== -1) {
      value = value.slice(0, commentIndex).trim()
    }

    if (key === "" || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      continue // chave inválida → ignora
    }

    // Desfaz aspas
    if (value.length >= 2) {
      const first = value[0]
      const last = value[value.length - 1]
      if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
        value = value.slice(1, -1)
      }
    }

    // Guarda apenas se a chave ainda não foi definida (primeiro wins)
    if (!(key in result)) {
      result[key] = value
    }
  }

  return result
}

/**
 * Resolve o caminho do arquivo .env, procurando na ordem:
 * 1. .env na root do plugin
 * 2. .env na home do usuário
 */
export function findEnvFile(): string | undefined {
  const possible = [
    path.join(process.cwd(), ".env"),
    path.join(os.homedir(), ".env"),
  ]

  for (const candidate of possible) {
    try {
      if (fs.existsSync(candidate)) {
        return candidate
      }
    } catch {
      // ignora permissão/negociação de caminho
    }
  }

  return undefined
}
