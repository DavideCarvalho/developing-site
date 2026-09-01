import { DateTime } from 'luxon'
import NpmMetric from '#models/npm_metric'
import db from '@adonisjs/lucid/services/db'
import { PACKAGES } from '../../database/data/packages.js'

type Pkg = { scope: string; packageName: string }
type Deps = {
  fetch?: (fullName: string) => Promise<number>
  backoffMs?: number
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>
  signal?: AbortSignal
}

const AVIARY_SCOPE = '@dudousxd'
const CONCURRENCY = 6
const MAX_ATTEMPTS = 7
const MAX_BACKOFF_MS = 10_000

async function fetchDownloads(fullName: string): Promise<number> {
  const url = `https://api.npmjs.org/downloads/point/last-month/${fullName}`
  const res = await fetch(url)
  if (!res.ok) throw Object.assign(new Error(`npm ${res.status}`), { status: res.status })
  const body = (await res.json()) as { downloads?: number }
  return body.downloads ?? 0
}

/**
 * `setTimeout` que aborta de verdade: um `AbortSignal` disparado durante a
 * espera rejeita imediatamente, em vez de deixar o timer completar e só
 * então checar se ainda importa. Isso é o que permite ao worker parar antes
 * de tentar escrever num pool de conexões que o shutdown da aplicação já
 * destruiu.
 */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.reject(new Error('aborted'))

  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer)
      reject(new Error('aborted'))
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

export default class NpmDownloadsService {
  #fetch: (fullName: string) => Promise<number>
  #backoffMs: number
  #sleep: (ms: number, signal?: AbortSignal) => Promise<void>
  #signal?: AbortSignal

  constructor(deps: Deps = {}) {
    this.#fetch = deps.fetch ?? fetchDownloads
    this.#backoffMs = deps.backoffMs ?? 800
    this.#sleep = deps.sleep ?? sleep
    this.#signal = deps.signal
  }

  /**
   * A API do npm responde 429 ao consultar os 178 pacotes de uma vez.
   * Concorrência limitada (CONCURRENCY workers), backoff exponencial com
   * teto (MAX_BACKOFF_MS), e resultado parcial é aceitável: pacote que
   * falhou mantém o último valor conhecido, nunca zera.
   *
   * `signal`, se passado, torna o processo cancelável: uma espera de
   * backoff em andamento é interrompida na hora (não espera o timer
   * completar para então checar), e nenhum worker tenta mais um fetch ou
   * uma escrita depois de abortado — existe para que um shutdown da
   * aplicação pare o sync em vez de correr contra ele.
   */
  async sync(packages: readonly Pkg[] = PACKAGES) {
    const queue = [...packages]
    const failed: string[] = []
    let updated = 0

    const worker = async () => {
      while (queue.length) {
        if (this.#signal?.aborted) return

        const pkg = queue.shift()!
        const fullName = `${pkg.scope}/${pkg.packageName}`
        let saved = false

        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
          if (this.#signal?.aborted) return

          try {
            const downloads = await this.#fetch(fullName)
            if (this.#signal?.aborted) return

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
            try {
              await this.#sleep(delay, this.#signal)
            } catch {
              // Abortado no meio da espera: para o worker inteiro agora,
              // sem tentar de novo e sem marcar o pacote como falho — ele
              // simplesmente fica pendente para a próxima execução.
              return
            }
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
