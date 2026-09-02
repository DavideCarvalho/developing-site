#!/bin/sh
# Entrypoint do container web.
#
# Existe porque nada no deploy rodava `migration:run`. Num primeiro deploy o primeiro
# briefing enviado batia num 500 por falta da tabela `briefings`, e o boot já falharia
# antes disso por falta das tabelas do @adonis-agora/durable (autoSchema está desligado:
# quem provisiona são as migrations, ver config/durable.ts).
#
# `exec` é obrigatório: sem ele o processo do Node vira filho do shell e o SIGTERM do
# orquestrador nunca chega no app — que é o que para e drena o loop do agendador antes
# do transport e do banco caírem.
set -e

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "==> migration:run"
  node ace migration:run --force
fi

exec "$@"
