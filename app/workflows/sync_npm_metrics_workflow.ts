import { BaseWorkflow } from '@adonis-agora/durable'
import type { WorkflowCtx } from '@adonis-agora/durable'
import app from '@adonisjs/core/services/app'
import logger from '@adonisjs/core/services/logger'
import NpmDownloadsService from '#services/npm_downloads_service'

/**
 * Atualiza `npm_metrics` com os downloads do último mês de cada pacote.
 *
 * A cadência mora na classe (`static schedule`) e não no `config/durable.ts`: ela é uma
 * propriedade DESTE trabalho, não do deploy — renomear ou apagar o workflow não pode deixar
 * uma entrada órfã num arquivo de config do outro lado do repo.
 *
 * `backfill` é o que conserta um buraco real do agendamento anterior: um deploy às 5h fazia o
 * dia inteiro ser pulado em silêncio. Com ele, a janela perdida é executada na volta. `maxCatchup: 1`
 * porque só a última janela interessa — a API do npm devolve sempre o mesmo recorte de 30 dias,
 * então repor várias janelas antigas só gastaria requisição pelo mesmo número.
 */
export default class SyncNpmMetricsWorkflow extends BaseWorkflow {
  static workflow = { name: 'sync_npm_metrics', version: '1' }

  static schedule = {
    cron: '0 5 * * *',
    timezone: 'America/Sao_Paulo',
    backfill: { maxCatchup: 1 },
  }

  async run(ctx: WorkflowCtx) {
    return ctx.localStep('sync', async () => {
      // Um shutdown (deploy, SIGTERM) não deve correr contra o sync. O drain do loop embedded
      // espera no máximo 10s e este sync leva minutos, então sem abortar de verdade uma espera
      // de backoff acordaria depois do pool do Lucid já ter sido destruído e tentaria escrever
      // nele. Abortado, o run fica incompleto e a recuperação do durable o retoma no próximo boot.
      const controller = new AbortController()
      app.terminating(async () => {
        controller.abort()
      })

      const { updated, failed } = await new NpmDownloadsService({
        signal: controller.signal,
      }).sync()

      if (failed.length) logger.warn({ failed }, 'pacotes sem atualização nesta rodada')
      return { updated, failed: failed.length }
    })
  }
}
