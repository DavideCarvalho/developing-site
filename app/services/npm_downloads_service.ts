import { DateTime } from 'luxon'
import NpmMetric from '#models/npm_metric'
import db from '@adonisjs/lucid/services/db'
import { PACKAGES } from '../../database/data/packages.js'

type Pkg = { scope: string; packageName: string }
type Deps = { fetch?: (fullName: string) => Promise<number>; backoffMs?: number }

const AVIARY_SCOPE = '@dudousxd'
const CONCURRENCY = 6
const MAX_ATTEMPTS = 6
const MAX_BACKOFF_MS = 10_000

async function fetchDownloads(fullName: string): Promise<number> {
  const url = `https://api.npmjs.org/downloads/point/last-month/${fullName}`
  const res = await fetch(url)
  if (!res.ok) throw Object.assign(new Error(`npm ${res.status}`), { status: res.status })
  const body = (await res.json()) as { downloads?: number }
  return body.downloads ?? 0
}

export default class NpmDownloadsService {
  #fetch: (fullName: string) => Promise<number>
  #backoffMs: number

  constructor(deps: Deps = {}) {
    this.#fetch = deps.fetch ?? fetchDownloads
    this.#backoffMs = deps.backoffMs ?? 800
  }

  /**
   * A API do npm responde 429 ao consultar os 178 pacotes de uma vez.
   * Concorrência limitada, backoff exponencial, e resultado parcial é
   * aceitável: pacote que falhou mantém o último valor conhecido, nunca zera.
   */
  async sync(packages: readonly Pkg[] = PACKAGES) {
    const queue = [...packages]
    const failed: string[] = []
    let updated = 0

    const worker = async () => {
      while (queue.length) {
        const pkg = queue.shift()!
        const fullName = `${pkg.scope}/${pkg.packageName}`
        let saved = false

        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
          try {
            const downloads = await this.#fetch(fullName)
            await NpmMetric.updateOrCreate(
              { scope: pkg.scope, packageName: pkg.packageName },
              { downloads, fetchedAt: DateTime.now() }
            )
            updated++
            saved = true
            break
          } catch (error) {
            const retryable =
              (error as { status?: number }).status === 429 || !('status' in (error as object))
            if (!retryable || attempt === MAX_ATTEMPTS) break
            const delay = Math.min(this.#backoffMs * 2 ** (attempt - 1), MAX_BACKOFF_MS)
            await new Promise((r) => setTimeout(r, delay))
          }
        }

        if (!saved) failed.push(fullName)
      }
    }

    await Promise.all(Array.from({ length: CONCURRENCY }, worker))
    return { updated, failed }
  }

  /**
   * null quando não há dado nenhum: a página omite a métrica em vez de
   * estampar zero, que seria pior do que não mostrar.
   */
  static async totals() {
    const rows = await db
      .from('npm_metrics')
      .select('scope')
      .sum('downloads as total')
      .groupBy('scope')

    if (rows.length === 0) return null

    let aviary = 0
    let agora = 0
    for (const row of rows) {
      const total = Number(row.total)
      if (row.scope === AVIARY_SCOPE) aviary += total
      else agora += total
    }

    return { aviary, agora, total: aviary + agora }
  }
}
