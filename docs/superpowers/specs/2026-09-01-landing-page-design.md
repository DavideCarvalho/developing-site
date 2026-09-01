# Landing page — Developing Consulting

Design aprovado em 2026-09-01. Este documento descreve **o que** será construído e **por quê**.
O plano de implementação é um documento separado.

## Contexto

DEVELOPING CONSULTING DESENVOLVEDOR DE SOFTWARE LT é uma consultoria de arquitetura e
desenvolvimento de software. Não há cases de cliente, logos ou time para exibir.

O que existe, e é mais forte do que qualquer um dos três: **dois ecossistemas open source
completos, mantidos pela empresa, com 178 pacotes publicados no npm.**

Contagem verificada contra o registry do npm em 2026-09-01 (147/147 e 31/31 publicados):

| Ecossistema | Alvo | Escopo npm | Famílias | Pacotes | Docs |
|---|---|---|---|---|---|
| Aviary | NestJS | `@dudousxd` | 13 | 147 | https://davidecarvalho.github.io/aviary/ |
| Agora | AdonisJS | `@adonis-agora` | 12 | 31 | https://davidecarvalho.github.io/agora/ |

**Famílias Aviary (13):** agent, authz, catalog, codegen, context, diagnostics, durable, filter,
inertia, media, notifications, resilience, telescope.
**Famílias Agora (12):** agent, authkit, authz, collaboration, context, diagnostics, durable,
filter, media, payments, resilience, telescope.

**Total: 25 famílias.**

> Divergências com os sites de docs, verificadas em 2026-09-01. O site do Aviary publica
> "119+ pacotes" e "12 famílias"; os números reais são 147 e 13 — `catalog` existe e está
> publicado, mas não aparece no site. A landing usa os números verificados; atualizar os sites
> de docs é trabalho separado, fora do escopo desta página.
>
> Licença: 177 dos 178 pacotes declaram MIT. `@dudousxd/nestjs-resilience` está sem campo
> `license` (e sem `description`) no `package.json`. Corrigir esse pacote antes de a página ir
> ao ar, para que a afirmação "MIT" seja verdadeira em 100% deles.

## Posicionamento

A página não vende "consultoria de software", que é indistinguível de mil outras. Vende uma
afirmação verificável:

> **Escrevemos a infraestrutura que outros times importam. A mesma engenharia entra no seu projeto.**

Essa é a tese central e todas as seções servem a ela. Um CTO avaliando fornecedor confia mais
em 178 pacotes cujo código ele pode ler do que em três logos numa fileira. A página é
otimizada para esse leitor: técnico, cético, com poder de compra.

Consequência: **a própria página é a prova**. Se ela for medíocre, contradiz a tese. Isso
eleva a régua de execução visual — a qualidade do build é argumento de venda, não enfeite.

## Serviços

Três ofertas, nesta ordem:

1. **Consultoria de arquitetura** — diagnóstico de sistemas existentes, decisões estruturais,
   revisão técnica. Entrada de menor compromisso.
2. **Projetos** — construção de ponta a ponta, do briefing à operação.
3. **Suporte às bibliotecas** — SLA comercial para quem roda Aviary ou Agora em produção.

O item 3 fecha o circuito: o open source deixa de ser vitrine e vira funil. Quem adota as
libs tem um caminho comercial de suporte, e quem contrata suporte já conhece a engenharia.

## Estrutura da página

Página única, oito seções, na ordem em que um comprador técnico decide:

1. **Hero** — wordmark, headline de posicionamento, dois CTAs: *Enviar briefing* (primário,
   âmbar) e *Ver o open source* (secundário, âncora).
2. **Barra de números** — `2 ecossistemas · 25 famílias · 178 pacotes no npm · MIT`.
   Ocupa estruturalmente o lugar da fileira de logos de cliente que não existe.
3. **Como trabalhamos** — quatro etapas: diagnóstico → especificação → construção → operação.
   Ancoradas no eixo vertical da textura da marca; cada etapa recebe um terminal geométrico
   (círculo → losango → quadrado), reaproveitando o vocabulário do asset TEXTURA.
4. **Serviços** — os três acima, cada um com uma frase do que é entregue.
5. **Open source** — dois blocos grandes, Aviary e Agora, cada um com suas famílias listadas
   em mono (13 e 12), contagem de pacotes e link para os docs. É a seção de portfólio e o
   coração da página.
6. **Stack** — AdonisJS, NestJS, React, Inertia, TypeScript, PostgreSQL.
7. **Briefing** — o formulário.
8. **Rodapé** — razão social, CNPJ, contato.

## Sistema visual

Direção: *Ideia → Software*. A logo é uma lâmpada formada por `{ | }`; a página é a narrativa
de uma ideia virando software rodando.

**Paleta** — extraída dos PSDs, três cores, sem adições:

| Token | Hex | Papel |
|---|---|---|
| `ink` | `#080808` | Palco. Fundo dominante. |
| `amber` | `#E8AB30` | Ignição. Só onde algo acende: CTA, número em destaque, etapa ativa. |
| `paper` | `#FFFFFF` | Texto e superfícies de contraste. |

O âmbar é escasso por regra. Se ele aparecer em tudo, deixa de significar qualquer coisa.

**Tema único escuro.** A marca nasceu em preto; não há toggle claro/escuro.

**Assets.** Os três PSDs são fonte, não entrega:

- `LOGO` e `NOME` → SVG vetorial (a marca precisa escalar e trocar de cor por CSS).
- `TEXTURA` → **recriada em SVG/CSS**, não exportada. O PSD é raster 3000×3000: não é
  responsivo nem animável. As barras viram o eixo vertical que atravessa a página e os
  terminais geométricos marcam as etapas da seção 3.

**Tipografia.** Grotesca geométrica nos títulos, casando com o desenho do wordmark; monoespaçada
nos detalhes técnicos — números, nomes de pacote, versões, escopos npm. O mono é o que faz a
seção de open source ler como código e não como marketing. A escolha das famílias concretas
acontece na implementação.

**Movimento.** Sóbrio e ligado ao scroll: o eixo vertical se desenha conforme a página desce,
os terminais acendem ao entrar em vista. Respeita `prefers-reduced-motion`.

## Arquitetura técnica

**Stack:** AdonisJS 6 + Inertia + React + Tailwind + Vite, PostgreSQL via Lucid.

Escolha do cliente. É mais peso do que uma landing estática exige, mas é a stack da casa e
deixa o caminho aberto para blog ou área do cliente sem migração. A contrapartida é obrigatória:

**SSR ligado.** Sem SSR, uma SPA Inertia entrega HTML vazio e sabota o SEO da única página que
existe. O SSR do Inertia para Adonis cobre isso.

> Armadilha conhecida: com Vite 8, o `app.css` com `@font-face` vaza para o build de SSR pelo
> plugin do Adonis e quebra o bundle (erro em `viteMetadata`). O contorno é `configEnvironment`
> nos dois vite configs. Já enfrentado em outro projeto da casa; tratar na implementação.

### Formulário de briefing

Campos: nome, empresa, e-mail, telefone (opcional), tipo de serviço
(arquitetura | projeto | suporte), faixa de orçamento (opcional), descrição do projeto.

**Fluxo:** `POST /briefing` → validação VineJS → persiste em `briefings` → dispara e-mail de
notificação → retorna à página com estado de sucesso.

**Grava e notifica, os dois.** Só e-mail perde lead quando o SMTP cai, e uma migration custa
quase nada. O banco é a fonte da verdade; o e-mail é o alerta.

**Modelo `Briefing`:** `id`, `name`, `company`, `email`, `phone?`, `service_type`,
`budget_range?`, `message`, `created_at`, `updated_at`.

**Anti-spam:** campo honeypot oculto + rate limit por IP. Sem CAPTCHA — atrito não se justifica
no volume esperado.

**Falha de e-mail não derruba o envio.** Se o SMTP falhar depois do commit, o lead já está
salvo e o usuário vê sucesso; a falha vai para o log. O contrário — perder o lead porque o
e-mail não saiu — é o erro caro.

### Rotas

| Método | Rota | Função |
|---|---|---|
| GET | `/` | Renderiza a landing (Inertia, SSR) |
| POST | `/briefing` | Recebe o formulário |

### Configuração

Dados institucionais confirmados, para o rodapé:

| Campo | Valor |
|---|---|
| Razão social | `DEVELOPING CONSULTING DESENVOLVEDOR DE SOFTWARE LT` |
| CNPJ | `39.598.365/0001-03` (dígitos verificadores validados) |

Os demais valores pendentes — e-mail de contato, telefone, domínio — ficam
centralizados em um único `config/site.ts`, com placeholders explícitos até o cliente fornecer.
Nunca espalhados pelos componentes. Trocar o CNPJ deve ser a edição de uma linha.

### SEO

Meta tags e Open Graph completos, JSON-LD `Organization`, `sitemap.xml`, `robots.txt`.
Imagem OG derivada da marca.

### Testes

Testes Japa cobrindo o único caminho que pode perder dinheiro — o endpoint de briefing:
validação rejeita entrada inválida, envio válido persiste a linha, e-mail é despachado
(mailer fake), honeypot preenchido é rejeitado, rate limit dispara. A renderização da landing
recebe um smoke test de que o SSR devolve HTML com conteúdo.

## Deploy

Guara Cloud, via Docker — é onde a casa já opera. Domínio a definir. Ambos são configuração,
não bloqueiam o desenvolvimento.

## Fora de escopo

Deliberadamente ausentes desta entrega: blog, versão em inglês, CMS, área do cliente, painel
administrativo dos briefings, integração com analytics, tema claro, agendamento de call.

A leitura dos leads na primeira versão é por acesso direto ao banco. Um painel admin se
justifica quando o volume existir — não antes.

## Pendências do cliente

Não bloqueiam o início da implementação; entram via `config/site.ts`:

- E-mail de contato e telefone
- Domínio de produção
- Credenciais SMTP do ambiente de produção
