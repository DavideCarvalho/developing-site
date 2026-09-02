# Todos os pacotes do projeto declaram engines.node >= 24.0.0 (ver
# package.json) — a imagem tem que ser 24, não 22, senão o npm ci já falha
# a checagem de engine antes de qualquer build.
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN node ace build

# node ace build compila o projeto INTEIRO (tsc não filtra por escopo de
# produção), tests/ incluso — o stage final copia build/ inteiro, então sem
# isso os specs compilados (asserções de verdade, ~100K) e o bin/test.js que
# os importa iam parar na imagem final. Removidos aqui, antes do
# COPY --from=build, para nunca cruzar pro stage de produção.
RUN rm -rf build/tests build/bin/test.js build/bin/test.js.map

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/build ./
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
EXPOSE 3333

# O entrypoint roda as migrações e depois faz exec no CMD. A mesma imagem sobe
# nos dois papéis que o deploy precisa (ver docs/deploy.md):
#
#   web     → CMD default abaixo
#   worker  → command: ["node","ace","queue:work"] + RUN_MIGRATIONS=false
#
# Sem o worker a linha de cron que start/scheduler.ts grava não é executada
# por ninguém: `npm_metrics` fica vazia para sempre e a página omite todos os
# números de download.
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "bin/server.js"]
