import type { HttpContext } from '@adonisjs/core/http'
import { createHash, timingSafeEqual } from 'node:crypto'
import app from '@adonisjs/core/services/app'
import logger from '@adonisjs/core/services/logger'
import env from '#start/env'
import NpmDownloadsService from '#services/npm_downloads_service'

/**
 * Gatilho do sync de métricas, chamado pelo cron da plataforma.
 *
 * Duas restrições moldam este handler:
 *
 *   1. O cron tem timeout de 30s e 3 tentativas. O sync dos 178 pacotes leva
 *      minutos por causa do backoff. Se a resposta esperasse o trabalho
 *      terminar, o cron desistiria e repetiria — disparando três syncs
 *      concorrentes contra a mesma tabela. Por isso responde 202 na hora e
 *      trabalha em background.
 *
 *   2. A rota existe no mesmo app que serve o site, então também responderia
 *      pelo endereço público. Um terceiro poderia disparar syncs à vontade e
 *      levar o npm a nos limitar por excesso de requisições. Daí o segredo.
 */
export default class InternalController {
  async syncNpmMetrics({ request, response }: HttpContext) {
    const expected = env.get('NPM_SYNC_TOKEN')
    const provided = request.header('x-sync-token') ?? ''

    // Compara hashes de tamanho fixo: timingSafeEqual exige buffers do mesmo
    // comprimento, e comparar os segredos crus vazaria o tamanho do token.
    const a = createHash('sha256').update(provided).digest()
    const b = createHash('sha256').update(expected).digest()

    if (!timingSafeEqual(a, b)) {
      // 404, não 401: para quem não tem o segredo, a rota não existe.
      return response.notFound()
    }

    // Sem await de propósito — ver restrição 1 acima.
    void this.#run()

    return response.accepted({ started: true })
  }

  async #run() {
    const controller = new AbortController()
    app.terminating(async () => {
      controller.abort()
    })

    try {
      const { updated, failed } = await new NpmDownloadsService({
        signal: controller.signal,
      }).sync()
      logger.info({ updated, failed: failed.length }, 'métricas do npm sincronizadas')
      if (failed.length) logger.warn({ failed }, 'pacotes sem atualização nesta rodada')
    } catch (error) {
      logger.error({ err: error }, 'sincronização de métricas do npm falhou')
    }
  }
}
