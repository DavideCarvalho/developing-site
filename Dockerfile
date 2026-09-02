# Todos os pacotes do projeto declaram engines.node >= 24.0.0 (ver
# package.json) — a imagem tem que ser 24, não 22, senão o npm ci já falha
# a checagem de engine antes de qualquer build.
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN node ace build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/build ./
EXPOSE 3333
CMD ["node", "bin/server.js"]
