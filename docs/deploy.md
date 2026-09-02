# Deploy

A imagem é uma só. O deploy sobe **dois processos** a partir dela, e nenhum
dos dois é opcional.

| papel  | comando                  | `RUN_MIGRATIONS` |
| ------ | ------------------------ | ---------------- |
| web    | `node bin/server.js`     | (default: `true`) |
| worker | `node ace queue:work`    | `false`          |

`docker-entrypoint.sh` roda `node ace migration:run --force` e só então faz
`exec` no comando do container. Quem migra é o **web**; o worker sobe com
`RUN_MIGRATIONS=false` para não disputar a mesma migração na mesma subida.

Em compose: `docker compose up --build` (ver `docker-compose.yml`). Em
plataformas que só aceitam um serviço por imagem (Fly, Railway, Kubernetes,
Guara), declare dois serviços/deployments apontando para a mesma imagem e
troque o comando e a variável conforme a tabela acima.

## Por que os dois

**Migrações.** Nada no deploy rodava `migration:run`. Num primeiro deploy o
banco não tem `briefings` (o primeiro briefing enviado dava 500), nem as
tabelas da fila — e essas o boot do servidor já precisa, porque
`start/scheduler.ts` grava a linha de cron do sync de métricas.

**Worker.** `QUEUE_DRIVER=database` faz `SyncNpmMetricsJob.schedule().cron()`
gravar uma linha agendada no banco. Quem executa linha agendada é o processo
`queue:work` do `@adonisjs/queue` — o servidor HTTP não executa nenhuma. Sem
o worker, `npm_metrics` fica vazia para sempre; e como toda a página omite
número que não existe (regra deliberada: número ausente é honesto, número
inventado não), a landing simplesmente nunca mostra nenhum download.

Um worker só é suficiente: `worker.concurrency` é 5 (`config/queue.ts`) e o
job é diário.

## Variáveis de ambiente

`.env.example` lista todas; `start/env.ts` valida e derruba o boot se faltar
alguma. As duas que só produção precisa de verdade:

- `APP_KEY` — chave de 32 bytes, secreta, igual nos dois containers.
- `SMTP_USERNAME` / `SMTP_PASSWORD` — opcionais no schema porque um relay
  local (Mailpit) não os usa; um provedor real usa. Sem eles, a notificação
  de briefing falha em silêncio (o lead continua salvo no banco).

O compose lê `.env.production`, que não está no repositório.

## Checklist de um deploy novo

1. `.env.production` preenchido (a partir de `.env.example`).
2. `docker compose up --build -d`.
3. `docker compose logs web | grep migration` — a saída tem que listar as
   migrações aplicadas.
4. `docker compose logs worker` — tem que dizer
   `Starting worker for queues: default`.
5. `curl -i https://…/nope` — tem que responder **404**, não 500.
6. No dia seguinte, `npm_metrics` deixa de estar vazia e os números aparecem
   na página. Para não esperar: `docker compose exec worker node ace
   queue:scheduler:list`.
