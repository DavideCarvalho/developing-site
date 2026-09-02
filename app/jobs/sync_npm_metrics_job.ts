import { Job } from '@adonisjs/queue'
import type { JobOptions } from '@adonisjs/queue/types'
import app from '@adonisjs/core/services/app'
import logger from '@adonisjs/core/services/logger'
import NpmDownloadsService from '#services/npm_downloads_service'

export default class SyncNpmMetricsJob extends Job {
  static options: JobOptions = {
    queue: 'default',
  }

  async execute() {
    // Um shutdown da aplicação (deploy, SIGTERM) não deve correr contra o
    // sync: "terminating" roda antes dos providers desligarem (e antes do
    // pool do Lucid ser destruído), então abortar aqui impede que uma
    // espera de backoff em andamento acorde e tente escrever num pool que
    // já não existe mais.
    const controller = new AbortController()
    app.terminating(async () => {
      controller.abort()
    })

    const { updated, failed } = await new NpmDownloadsService({ signal: controller.signal }).sync()
    logger.info({ updated, failed: failed.length }, 'métricas do npm sincronizadas')
    if (failed.length) logger.warn({ failed }, 'pacotes sem atualização nesta rodada')
  }

  async failed(error: Error) {
    logger.error({ err: error }, 'sincronização de métricas do npm falhou')
  }
}
