import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import { WorkflowEngine } from '@adonis-agora/durable'
import { CronExpressionParser } from 'cron-parser'

/**
 * O agendamento do sync falha de um jeito silencioso: se o workflow não for descoberto, ou se a
 * expressão de cron não puder ser lida, nada quebra — o sync simplesmente nunca roda, `npm_metrics`
 * para no tempo e a página passa a omitir os downloads sem um único erro em lugar nenhum.
 *
 * Estes testes existem para transformar esse silêncio em vermelho.
 */
test.group('Agendamento do sync de métricas', () => {
  test('o workflow é descoberto e agendado', async ({ assert }) => {
    const engine = await app.container.make(WorkflowEngine)
    const schedule = engine.discoveredSchedules.find((s) => s.workflow === 'sync_npm_metrics')

    // A descoberta é por varredura de app/workflows em runtime (os hooks de codegen do durable
    // estão fora do adonisrc — ver a nota lá). Se essa varredura parar de achar a classe, é aqui
    // que se descobre, e não meses depois olhando um número velho na home.
    assert.exists(schedule, 'workflow sync_npm_metrics não foi descoberto pelo durable')
    assert.equal(schedule!.cron, '0 5 * * *')
    assert.equal(schedule!.timezone, 'America/Sao_Paulo')
  })

  test('a expressão de cron é legível pelo cron-parser', async ({ assert }) => {
    // `cron-parser` é peer OPCIONAL do durable: sem ele instalado, um schedule com `cron` não
    // dispara e o durable não reclama. Este teste é o que impede alguém de removê-lo do
    // package.json achando que é dependência morta.
    const engine = await app.container.make(WorkflowEngine)
    const schedule = engine.discoveredSchedules.find((s) => s.workflow === 'sync_npm_metrics')!

    const next = CronExpressionParser.parse(schedule.cron!, { tz: schedule.timezone }).next().toDate()

    assert.equal(next.getHours() >= 0, true)
    // 5h no fuso de São Paulo — lido de volta no mesmo fuso, para não depender do TZ da máquina.
    const hourInSaoPaulo = Number(
      new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: 'numeric',
        hour12: false,
      }).format(next)
    )
    assert.equal(hourInSaoPaulo, 5)
  })
})
