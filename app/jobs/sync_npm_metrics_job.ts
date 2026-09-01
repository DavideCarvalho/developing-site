import { Job } from '@adonisjs/queue'
import type { JobOptions } from '@adonisjs/queue/types'
import logger from '@adonisjs/core/services/logger'
import NpmDownloadsService from '#services/npm_downloads_service'

export default class SyncNpmMetricsJob extends Job {
  static options: JobOptions = {
    queue: 'default',
  }

  async execute() {
    const { updated, failed } = await new NpmDownloadsService().sync()
    logger.info({ updated, failed: failed.length }, 'métricas do npm sincronizadas')
    if (failed.length) logger.warn({ failed }, 'pacotes sem atualização nesta rodada')
  }

  async failed(error: Error) {
    logger.error({ err: error }, 'sincronização de métricas do npm falhou')
  }
}
