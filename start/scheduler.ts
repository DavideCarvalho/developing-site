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
 * Quem agenda é o @adonis-agora/durable: a cadência do único trabalho recorrente do site mora
 * na classe do workflow (`static schedule` em app/workflows/sync_npm_metrics_workflow.ts), e o
 * loop que a dispara roda dentro do próprio processo web (`worker.embedded` em config/durable.ts).
 *
 * Uma linha de cron escrita aqui dependeria de um `queue:work` rodando. Não existe worker neste
 * deploy, então ela ficaria gravada no banco e nunca seria executada — parecendo agendada.
 */

export {}
