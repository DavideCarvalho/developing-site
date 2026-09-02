# Deploy

Uma imagem, **um processo**:

```
node bin/server.js
```

`docker-entrypoint.sh` roda `node ace migration:run --force` e só então faz `exec` no comando do
container. O `exec` é obrigatório: sem ele o Node vira filho do shell e o SIGTERM do orquestrador
nunca chega no app — que é o que dispara o desligamento ordenado do agendador.

Em compose: `docker compose up --build` (ver `docker-compose.yml`).

## Onde mora o agendamento

O único trabalho recorrente do site é o sync de downloads do npm. Ele **não** tem container próprio
e **não** depende de cron da plataforma.

Quem agenda é o `@adonis-agora/durable`:

- a cadência está na classe do workflow — `static schedule` em
  `app/workflows/sync_npm_metrics_workflow.ts`, cron `0 5 * * *` no fuso `America/Sao_Paulo`;
- o loop que dispara roda **dentro do processo web** (`worker.embedded` em `config/durable.ts`).

Uma landing page não justifica um segundo container ocioso 24h para disparar uma tarefa diária.

### O que isso protege

**Deploy na hora da janela.** `backfill: { maxCatchup: 1 }` faz a janela perdida rodar na volta. No
desenho anterior, um deploy às 5h pulava o dia inteiro em silêncio.

**Estado sobrevive a restart.** O store é `lucid` (Postgres), não o `memory` do stub. Sem estado
persistido, um restart apagaria a memória de que a janela não rodou — e o backfill não teria o que
consultar.

**Exatamente uma vez.** O run id é determinístico por janela de tempo, então mesmo com várias
instâncias web ticando ao mesmo tempo cada janela começa uma única vez.

**O loop não vaza para outros ambientes.** Ele só sobe no ambiente `web`. Um `node ace
migration:run` não vira worker sem querer.

### Rodar à mão

```
node ace npm:sync
```

Sem nenhuma execução, `npm_metrics` fica vazia e a página **omite** todos os números de download —
comportamento correto diante de ausência de dado (número ausente é honesto, número inventado não),
mas perde a prova mais forte do site.

## Variáveis de ambiente

`.env.example` lista todas; `start/env.ts` valida e derruba o boot se faltar alguma. As que só
produção precisa de verdade:

- `APP_KEY` — chave de 32 bytes, secreta.
- `SMTP_USERNAME` / `SMTP_PASSWORD` — opcionais no schema porque um relay local (Mailpit) não os
  usa; um provedor real usa. Sem eles, a notificação de briefing falha em silêncio (o lead continua
  salvo no banco).

`QUEUE_DRIVER` ainda existe porque `@adonisjs/queue` continua instalado, mas **não há job nenhum**
nem consumidor de fila. Deixe em `sync`.

## Checklist de um deploy novo

1. `.env.production` preenchido (a partir de `.env.example`).
2. `docker compose up --build -d`.
3. `docker compose logs web | grep migration` — tem que listar as migrações aplicadas.
4. `docker compose logs web | grep "embedded worker"` — tem que dizer
   `durable: embedded worker started (interval 30000ms, 1 schedule(s))`. **1 schedule**: zero
   significa que o workflow não foi descoberto e o sync nunca vai rodar.
5. `curl -i https://…/nope` — tem que responder **404**, não 500.
6. Os números aparecem na página depois da primeira execução do sync.
