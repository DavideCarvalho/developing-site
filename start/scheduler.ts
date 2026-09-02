/*
|--------------------------------------------------------------------------
| Scheduler
|--------------------------------------------------------------------------
|
| This file is used to define scheduled jobs. Imports are static, never
| dynamic import() inside a scheduler callback — a standing house rule.
|
*/

import SyncNpmMetricsJob from '#jobs/sync_npm_metrics_job'

await SyncNpmMetricsJob.schedule({}).cron('0 5 * * *').timezone('America/Sao_Paulo').run()
