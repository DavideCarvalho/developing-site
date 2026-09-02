/*
|--------------------------------------------------------------------------
| Scheduler
|--------------------------------------------------------------------------
|
| This file is used to define scheduled jobs. Imports are static, never
| dynamic import() inside a scheduler callback — a standing house rule.
|
*/

/*
 * Sem agendamento aqui, de propósito.
 *
 * O deploy não tem worker: uma landing page não justifica um container ocioso
 * 24h para disparar uma tarefa diária. A linha de cron que este arquivo
 * gravaria só é executada por um `queue:work` rodando — sem ele, ficaria
 * escrita no banco e nunca executada, dando a impressão de estar agendada.
 *
 * Quem agenda o sync de métricas é o cron da plataforma, chamando
 * `node ace npm:sync` (ver commands/sync_npm_metrics.ts e docs/deploy.md).
 */

export {}
