import { defineConfig, stores, transports } from '@adonis-agora/durable'

/**
 * Configuração do @adonis-agora/durable.
 *
 * `event-emitter`, não `memory`: o transport `memory` do stub é para teste e perde tudo no
 * restart. O `event-emitter` roda os steps neste mesmo processo, sem Redis nem broker — a forma
 * certa para um app de processo único em produção.
 *
 * O store é `lucid` (Postgres) justamente para o estado SOBREVIVER a um restart. É disso que
 * depende o `backfill` do schedule: sem estado persistido, um deploy na hora da janela apagaria
 * a memória de que ela não rodou, e o dia seria pulado — exatamente o buraco que este desenho
 * existe para fechar.
 *
 * `autoSchema: false` porque o `configure` gerou migrations explícitas e o container já roda
 * `migration:run` no boot (ver docker-entrypoint.sh). Uma única via de provisionamento, revisável
 * em code review, em vez de DDL implícito no boot.
 */
export default defineConfig({
  transport: 'event-emitter',
  transports: {
    'event-emitter': transports.eventEmitter(),
  },

  store: 'lucid',
  stores: {
    lucid: stores.lucid({ connection: 'pg' }),
  },

  autoSchema: false,

  /**
   * O loop do worker roda DENTRO do processo web: uma landing page não justifica um segundo
   * container ocioso 24h para disparar uma tarefa diária. O loop só sobe no ambiente `web`, então
   * um `node ace migration:run` não vira worker sem querer.
   *
   * `intervalMs` alto de propósito: o único agendamento aqui é diário, e cada tick é uma consulta
   * ao Postgres. A 30s, a janela do cron é respeitada com folga de sobra e o banco fica em paz.
   */
  worker: {
    embedded: true,
    intervalMs: 30_000,
  },

  /**
   * Sem `schedules` aqui de propósito: a cadência do sync mora na própria classe do workflow
   * (`static schedule` em app/workflows/sync_npm_metrics_workflow.ts). Este arquivo é onde um
   * deploy específico SOBREPÕE aquela cadência — pausar em staging, por exemplo — e no momento
   * não há nada a sobrepor.
   */
})
