#!/bin/sh
# Entrypoint único das duas funções da imagem (web e worker).
#
# Existe por dois motivos concretos:
#
#   1. Nada no deploy rodava `migration:run`. Num primeiro deploy o primeiro
#      briefing enviado batia num 500 por falta da tabela `briefings` — e o
#      próprio boot do servidor já falharia antes disso, porque
#      start/scheduler.ts grava a linha de cron nas tabelas da fila.
#
#   2. Só a migração pode rodar antes de qualquer processo servir tráfego, e
#      só UMA vez. Quem migra é o container web (RUN_MIGRATIONS não definido);
#      o container do worker sobe com RUN_MIGRATIONS=false para não correr a
#      mesma migração em paralelo.
#
# O comando final vem do CMD/command, então a mesma imagem serve os dois
# papéis:
#
#   web:    node bin/server.js       (default do Dockerfile)
#   worker: node ace queue:work      (RUN_MIGRATIONS=false)
#
# `exec` é obrigatório: sem ele o processo do Node vira filho do shell e o
# SIGTERM do orquestrador nunca chega no app — que é o que dispara o
# `app.terminating()` usado pelo sync de métricas para abortar (ver
# app/jobs/sync_npm_metrics_job.ts).
set -e

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "==> migration:run"
  node ace migration:run --force
fi

exec "$@"
