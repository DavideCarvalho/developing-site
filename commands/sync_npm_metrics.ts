import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import app from '@adonisjs/core/services/app'
import NpmDownloadsService from '#services/npm_downloads_service'

/**
 * Sincroniza os downloads dos pacotes no npm para a tabela `npm_metrics`.
 *
 * Existe como comando (e não só como job na fila) porque o deploy não tem um
 * worker: o site é uma landing page e manter um container ocioso 24h para
 * disparar uma tarefa por dia não se paga. Quem agenda é o cron da plataforma,
 * que sobe um container, roda isto e morre.
 *
 * Sem esta execução a tabela fica vazia e a página omite todos os números de
 * download — que é o comportamento correto diante de ausência de dado, mas
 * significa perder a prova mais forte que o site tem.
 */
export default class SyncNpmMetrics extends BaseCommand {
  static commandName = 'npm:sync'
  static description = 'Busca os downloads do último mês no npm e grava em npm_metrics'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    // Mesmo motivo do job: um SIGTERM no meio de uma espera de backoff não
    // pode acordar depois e escrever num pool de conexão já destruído.
    const controller = new AbortController()
    app.terminating(async () => {
      controller.abort()
    })

    const { updated, failed } = await new NpmDownloadsService({
      signal: controller.signal,
    }).sync()

    this.logger.info(`${updated} pacote(s) atualizado(s)`)

    if (failed.length) {
      // Falha parcial é esperada: a API do npm devolve 429 com frequência.
      // Cada pacote que falhou mantém o último valor conhecido em vez de
      // zerar, então isto é aviso, não erro.
      this.logger.warning(`${failed.length} sem atualização nesta rodada: ${failed.join(', ')}`)
    }
  }
}
