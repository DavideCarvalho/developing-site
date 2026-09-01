# Landing page Developing Consulting — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publicar a landing page institucional da Developing Consulting, bilíngue, com o open source como prova social e um formulário de briefing que grava em banco e notifica por e-mail.

**Architecture:** Aplicação AdonisJS 7 servindo uma página Inertia+React com SSR ligado. Dois locales por rota (`/` e `/en`), resolvidos por middleware e entregues como props. Os números de download do npm vivem numa tabela alimentada por job diário, nunca buscados na requisição. O briefing grava primeiro e notifica depois, para que falha de SMTP não perca lead.

**Tech Stack:** AdonisJS 7, Inertia 4, React 19, Tailwind 4, Lucid 22 sobre PostgreSQL, VineJS 4, Vite 7, Japa 4.

**Spec:** `docs/superpowers/specs/2026-09-01-landing-page-design.md`

## Global Constraints

- **AdonisJS 7, não 6.** O spec diz "AdonisJS 6"; está desatualizado. Toda a casa (`imob-analytics`, `prondeuvou`, `anua-v2`) roda `@adonisjs/core` 7. Seguir o 7.
- **Versões fixas, sem `^` nem `~`**, em todo `package.json`.
- **Node 24 ou superior.** Todo pacote Adonis atual declara `engines.node >= 24.0.0`.
- **Versões exatas a usar** — resolvidas contra o registry em 2026-09-01, tudo na mais recente
  compatível entre si:

  | Pacote | Versão | | Pacote | Versão |
  |---|---|---|---|---|
  | `@adonisjs/core` | 7.5.0 | | `vite` | 8.2.2 |
  | `@adonisjs/inertia` | 5.0.1 | | `@vitejs/plugin-react` | 6.1.1 |
  | `@adonisjs/vite` | 6.0.2 | | `@inertiajs/react` | 3.7.0 |
  | `@adonisjs/i18n` | 3.0.1 | | `react` / `react-dom` | 19.2.8 |
  | `@adonisjs/lucid` | 22.4.2 | | `tailwindcss` | 4.3.3 |
  | `@adonisjs/mail` | 10.4.0 | | `@tailwindcss/vite` | 4.3.3 |
  | `@adonisjs/limiter` | 3.0.1 | | `@japa/runner` | 5.3.0 |
  | `@adonisjs/session` | 8.1.0 | | `@japa/assert` | 4.2.0 |
  | `@adonisjs/shield` | 9.0.0 | | `@japa/plugin-adonisjs` | 5.2.0 |
  | `@adonisjs/assembler` | 8.5.0 | | `@japa/api-client` | 3.2.1 |
  | `@vinejs/vine` | 4.4.0 | | `typescript` | **6.0.3** |

- **TypeScript fica em 6.0.3, não em 7.0.2.** O npm publica 7.0.2 como `latest`, mas
  `@adonisjs/assembler` 8.5.0 declara `typescript: "^5.0.0 || ^6.0.0"` como peer dependency —
  o 7 está fora da faixa. O assembler é quem compila e faz o build, então isso quebra, não
  apenas avisa. 6.0.3 é a maior compatível e é contra ela que o próprio Adonis desenvolve
  (`@adonisjs/core` a traz em devDependencies). Reavaliar quando o assembler abrir o `^7`.

- **Vite 8 é obrigatório, e o bug de CSS no SSR tem que ser tratado.** `@adonisjs/inertia`
  5.0.1 exige `vite ^8.2.2`; não há a opção de ficar no 7. No Vite 8, o CSS de entrada
  registrado pelo plugin do Adonis vaza para o build de SSR e quebra o bundle com erro em
  `viteMetadata`. Duas defesas, ambas obrigatórias: **(a)** nenhuma `@font-face` no
  `app.css` — as fontes entram por `<link>` na view (Task 1, Step 7); **(b)** um guard de
  `configEnvironment` fixando a entrada do ambiente `ssr` (Task 1, Step 11).
- **Sem import dinâmico dentro de callback de scheduler.** Jobs são importados estaticamente no topo de `start/scheduler.ts`.
- **Paleta fechada em três cores.** `--ink #080808`, `--amber #E8AB30`, `--paper #FFFFFF`. Nenhuma cor nova.
- **Âmbar é escasso.** Só CTA primário, número em destaque, estado ativo e hover de link. Nunca em seletor de idioma, borda decorativa ou fundo de seção.
- **Tema escuro único.** Sem toggle claro/escuro.
- **O dispositivo das chaves (`{dev}eloping software`) aparece uma vez**, na tagline do hero, e não se traduz.
- **Números institucionais verificados em 2026-09-01:** 2 ecossistemas, 25 famílias (Aviary 13, Agora 12), 178 pacotes, 207.760 downloads/mês (Aviary 146.393, Agora 61.367).
- **Nunca cravar downloads no código.** Sempre da tabela `npm_metrics`.
- **Razão social exata:** `DEVELOPING CONSULTING DESENVOLVEDOR DE SOFTWARE LT` · CNPJ `39.598.365/0001-03`.

---

### Task 1: Scaffold, tokens de marca e a rota raiz com SSR

**Files:**
- Create: projeto inteiro via `create-adonisjs`
- Create: `config/site.ts`
- Create: `resources/css/app.css`
- Create: `app/controllers/landing_controller.ts`
- Modify: `start/routes.ts`
- Modify: `vite.config.ts`
- Test: `tests/functional/landing.spec.ts`

**Interfaces:**
- Consumes: nada (primeira task)
- Produces: `config/site.ts` exportando `siteConfig` com `{ legalName: string, cnpj: string, email: string, phone: string | null, domain: string, docs: { aviary: string, agora: string } }`; rota `GET /` renderizando a página Inertia `landing`; `LandingController.show(ctx: HttpContext)`.

- [ ] **Step 1: Criar o projeto**

```bash
cd /home/dudousxd/personal/Developing
npm create adonisjs@latest -- . --kit=inertia --adapter=react --db=postgres --auth-guard=session
```

Responder: sobrescrever nada fora de `Logo, Nome, Textura/` e `docs/`. Se o instalador recusar diretório não-vazio, criar em `.tmp-scaffold/` e mover o conteúdo para a raiz preservando `docs/` e `Logo, Nome, Textura/`.

- [ ] **Step 2: Fixar todas as versões sem caret**

Editar `package.json` trocando cada `^x.y.z` / `~x.y.z` pelos valores exatos da tabela em
Global Constraints — sem caret, sem til. Atenção ao `typescript`: **6.0.3**, não o `latest`
do npm, pelo motivo registrado lá.

```bash
node --version                 # precisa ser >= 24
rm -rf node_modules package-lock.json && npm install
npx tsc --noEmit
```

Esperado: instalação sem `EPEERINVALID` e sem erro de tipo. Se o npm reclamar de peer
dependency do TypeScript, é porque alguém subiu para o 7 — voltar para 6.0.3.

- [ ] **Step 3: Escrever o teste que falha**

`tests/functional/landing.spec.ts`:

```ts
import { test } from '@japa/runner'

test.group('Landing', () => {
  test('a raiz responde 200 com HTML renderizado no servidor', async ({ client, assert }) => {
    const response = await client.get('/')

    response.assertStatus(200)
    assert.include(response.text(), 'DEVELOPING CONSULTING DESENVOLVEDOR DE SOFTWARE LT')
    // As chaves são spans âmbar separados, então a string não aparece
    // contígua no HTML. Asserta o que de fato é um só nó de texto.
    assert.include(response.text(), 'eloping software')
  })
})
```

- [ ] **Step 4: Rodar e confirmar a falha**

Run: `node ace test functional --files=landing.spec.ts`
Esperado: FAIL — rota `/` inexistente ou HTML sem o conteúdo.

- [ ] **Step 5: Criar `config/site.ts`**

```ts
/**
 * Dados institucionais e endpoints externos num lugar só.
 * Trocar o CNPJ deve ser a edição de uma linha, nunca uma busca por componente.
 */
export const siteConfig = {
  legalName: 'DEVELOPING CONSULTING DESENVOLVEDOR DE SOFTWARE LT',
  cnpj: '39.598.365/0001-03',
  email: 'contato@developing.com.br',
  phone: null as string | null,
  domain: 'https://developing.com.br',
  docs: {
    aviary: 'https://davidecarvalho.github.io/aviary/',
    agora: 'https://davidecarvalho.github.io/agora/',
  },
} as const

export type SiteConfig = typeof siteConfig
```

`email`, `phone` e `domain` são placeholders declarados até o cliente fornecer. Não espalhar esses valores por componente.

- [ ] **Step 6: Definir os tokens de marca**

`resources/css/app.css`:

```css
@import "tailwindcss";

@theme {
  --color-ink: #080808;
  --color-ink-raise: #0f0f0e;
  --color-ink-sunk: #050505;
  --color-amber: #e8ab30;
  --color-amber-deep: #8a6620;
  --color-paper: #ffffff;
  --color-paper-2: #a8a49c;
  --color-paper-3: #6b6862;

  --font-display: "Poppins", "Segoe UI", system-ui, sans-serif;
  --font-body: "Archivo", "Segoe UI", system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, Menlo, monospace;
}

html { color-scheme: dark; }

body {
  background: var(--color-ink);
  color: var(--color-paper);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
}

::selection { background: var(--color-amber); color: var(--color-ink); }
:focus-visible { outline: 2px solid var(--color-amber); outline-offset: 3px; }
```

- [ ] **Step 7: Carregar as três famílias tipográficas**

Em `resources/views/inertia_layout.edge`, dentro do `<head>`:

```edge
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;800&family=Archivo:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
```

Poppins ExtraBold é a tipografia do próprio wordmark — foi identificada a partir do PSD
(bojos perfeitamente circulares, pingo do `i` redondo, `g` de andar único). Archivo carrega o
corpo e IBM Plex Mono os dados técnicos.

Carregar por `<link>` na view, **não** por `@font-face` no `app.css`: é exatamente o
`@font-face` dentro do CSS de entrada que vaza para o build de SSR pelo plugin do Adonis e
quebra o bundle no Vite 8. Pela view, o problema não existe nem hoje nem depois.

- [ ] **Step 8: Criar o controller**

`app/controllers/landing_controller.ts`:

```ts
import type { HttpContext } from '@adonisjs/core/http'
import { siteConfig } from '#config/site'

export default class LandingController {
  async show({ inertia }: HttpContext) {
    return inertia.render('landing', {
      site: siteConfig,
    })
  }
}
```

- [ ] **Step 9: Registrar a rota**

`start/routes.ts`:

```ts
import router from '@adonisjs/core/services/router'
const LandingController = () => import('#controllers/landing_controller')

router.get('/', [LandingController, 'show']).as('landing')
```

- [ ] **Step 10: Criar a página React mínima**

`inertia/pages/landing.tsx`:

```tsx
import type { SiteConfig } from '#config/site'

export default function Landing({ site }: { site: SiteConfig }) {
  return (
    <main>
      <p className="font-display font-extrabold">
        <span className="text-amber">{'{'}</span>dev
        <span className="text-amber">{'}'}</span>eloping software
      </p>
      <footer className="font-mono text-paper-3">
        {site.legalName}
        <br />
        CNPJ {site.cnpj}
      </footer>
    </main>
  )
}
```

- [ ] **Step 11: Ligar SSR**

`config/inertia.ts`:

```ts
import { defineConfig } from '@adonisjs/inertia'

export default defineConfig({
  rootView: 'inertia_layout',
  encryptHistory: true,
  ssr: {
    enabled: true,
    entrypoint: 'inertia/app/ssr.tsx',
  },
})
```

`vite.config.ts` — manter `vite` em 7.3.1:

```ts
import { defineConfig } from 'vite'
import inertia from '@adonisjs/inertia/vite'
import react from '@vitejs/plugin-react'
import adonisjs from '@adonisjs/vite/client'
import tailwindcss from '@tailwindcss/vite'

/**
 * No Vite 8, o `resources/css/app.css` que o plugin do Adonis registra como
 * entrypoint vaza para o build de SSR e o quebra com erro em `viteMetadata`.
 * O ambiente `ssr` só pode ter uma entrada: o próprio ssr.tsx.
 */
const ssrCssGuard = {
  name: 'developing:ssr-css-guard',
  configEnvironment(name: string, config: any) {
    if (name !== 'ssr') return
    config.build ??= {}
    config.build.rollupOptions ??= {}
    config.build.rollupOptions.input = ['inertia/app/ssr.tsx']
  },
}

export default defineConfig({
  plugins: [
    tailwindcss(),
    inertia({ ssr: { enabled: true, entrypoint: 'inertia/app/ssr.tsx' } }),
    react(),
    adonisjs({
      entrypoints: ['inertia/app/app.tsx', 'resources/css/app.css'],
      reload: ['resources/views/**/*.edge'],
    }),
    ssrCssGuard,
  ],
  resolve: {
    alias: {
      '#config': `${import.meta.dirname}/config`,
      '~': `${import.meta.dirname}/inertia`,
    },
  },
})
```

- [ ] **Step 12: Rodar e confirmar que passa**

Run: `node ace test functional --files=landing.spec.ts`
Esperado: PASS. O `assert.include` sobre o HTML só passa com SSR ligado — é essa a asserção que prova o SSR.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: scaffold adonis 7 com inertia ssr, tokens de marca e config/site"
```

---

### Task 2: Dois locales por rota

**Files:**
- Create: `config/i18n.ts`
- Create: `resources/lang/pt-BR/site.json`
- Create: `resources/lang/en/site.json`
- Create: `app/middleware/locale_middleware.ts`
- Modify: `start/routes.ts`
- Modify: `start/kernel.ts`
- Modify: `app/controllers/landing_controller.ts`
- Test: `tests/functional/locale.spec.ts`

**Interfaces:**
- Consumes: `LandingController.show` da Task 1, `siteConfig`.
- Produces: `LocaleMiddleware` que grava `ctx.i18n` e expõe `ctx.locale: 'pt-BR' | 'en'`; props Inertia `{ locale: 'pt-BR' | 'en', messages: Record<string, string>, alternate: { locale: string, href: string }[] }`.

- [ ] **Step 1: Escrever o teste que falha**

`tests/functional/locale.spec.ts`:

```ts
import { test } from '@japa/runner'

test.group('Locale', () => {
  test('a raiz entrega português', async ({ client, assert }) => {
    const response = await client.get('/')
    response.assertStatus(200)
    assert.include(response.text(), 'Escrevemos a infraestrutura que outros times importam.')
  })

  test('/en entrega inglês', async ({ client, assert }) => {
    const response = await client.get('/en')
    response.assertStatus(200)
    assert.include(response.text(), 'The team behind the packages you already run.')
  })

  test('cada locale aponta hreflang para o outro', async ({ client, assert }) => {
    const response = await client.get('/')
    assert.include(response.text(), 'hreflang="en"')
    assert.include(response.text(), '/en')
  })

  test('Accept-Language em inglês redireciona a raiz para /en', async ({ client }) => {
    const response = await client
      .get('/')
      .header('Accept-Language', 'en-US,en;q=0.9')
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/en')
  })

  test('a escolha explícita do usuário vence a negociação', async ({ client }) => {
    const response = await client
      .get('/')
      .header('Accept-Language', 'en-US,en;q=0.9')
      .withCookie('locale', 'pt-BR')
      .redirects(0)

    response.assertStatus(200)
  })
})
```

- [ ] **Step 2: Rodar e confirmar a falha**

Run: `node ace test functional --files=locale.spec.ts`
Esperado: FAIL — `/en` responde 404.

- [ ] **Step 3: Configurar o i18n**

```bash
node ace add @adonisjs/i18n
```

`config/i18n.ts`:

```ts
import app from '@adonisjs/core/services/app'
import { defineConfig, formatters, loaders } from '@adonisjs/i18n'

export default defineConfig({
  defaultLocale: 'pt-BR',
  supportedLocales: ['pt-BR', 'en'],
  formatter: formatters.icu(),
  loaders: [loaders.fs({ location: app.languageFilesPath() })],
})
```

- [ ] **Step 4: Criar os arquivos de tradução**

`resources/lang/pt-BR/site.json` — apenas as chaves do hero nesta task; as demais entram na Task 4:

```json
{
  "hero.headline": "Escrevemos a infraestrutura que outros times importam.",
  "hero.cta_primary": "Enviar briefing",
  "hero.cta_secondary": "Ver o open source",
  "nav.process": "Como trabalhamos",
  "nav.services": "Serviços",
  "nav.oss": "Open source",
  "nav.cta": "Enviar briefing"
}
```

`resources/lang/en/site.json`:

```json
{
  "hero.headline": "The team behind the packages you already run.",
  "hero.cta_primary": "Get commercial support",
  "hero.cta_secondary": "Browse the packages",
  "nav.process": "How we work",
  "nav.services": "Services",
  "nav.oss": "Open source",
  "nav.cta": "Talk to us"
}
```

O inglês não é tradução: é outro leitor. Ver a tabela de ênfase por locale no spec antes de escrever qualquer string nova.

- [ ] **Step 5: Criar o middleware de locale**

`app/middleware/locale_middleware.ts`:

```ts
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import i18nManager from '@adonisjs/i18n/services/main'

const SUPPORTED = ['pt-BR', 'en'] as const
export type Locale = (typeof SUPPORTED)[number]

export default class LocaleMiddleware {
  async handle(ctx: HttpContext, next: NextFn, options: { locale?: Locale } = {}) {
    // A rota manda: /en é inglês, / é português.
    let locale: Locale = options.locale ?? 'pt-BR'

    // Só a raiz negocia. Se o visitante já escolheu antes, a escolha vence.
    if (!options.locale) {
      const chosen = ctx.request.cookie('locale') as Locale | undefined
      if (chosen && SUPPORTED.includes(chosen)) {
        locale = chosen
      } else {
        const negotiated = ctx.request.language([...SUPPORTED])
        if (negotiated === 'en') {
          return ctx.response.redirect('/en')
        }
      }
    }

    ctx.i18n = i18nManager.locale(locale)
    ctx.locale = locale
    return next()
  }
}

declare module '@adonisjs/core/http' {
  interface HttpContext {
    locale: Locale
  }
}
```

- [ ] **Step 6: Registrar o middleware**

`start/kernel.ts`, na lista de middleware nomeados:

```ts
export const middleware = router.named({
  locale: () => import('#middleware/locale_middleware'),
})
```

- [ ] **Step 7: Registrar as duas rotas**

`start/routes.ts`:

```ts
import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const LandingController = () => import('#controllers/landing_controller')

router.get('/', [LandingController, 'show']).use(middleware.locale()).as('landing.pt')
router
  .get('/en', [LandingController, 'show'])
  .use(middleware.locale({ locale: 'en' }))
  .as('landing.en')
```

- [ ] **Step 8: Entregar locale e mensagens como props**

`app/controllers/landing_controller.ts`:

```ts
import type { HttpContext } from '@adonisjs/core/http'
import i18nManager from '@adonisjs/i18n/services/main'
import { siteConfig } from '#config/site'

export default class LandingController {
  async show({ inertia, locale }: HttpContext) {
    return inertia.render('landing', {
      site: siteConfig,
      locale,
      messages: i18nManager.getTranslationsFor(locale),
      alternate: [
        { locale: 'pt-BR', href: `${siteConfig.domain}/` },
        { locale: 'en', href: `${siteConfig.domain}/en` },
      ],
    })
  }
}
```

- [ ] **Step 9: Emitir hreflang na view raiz**

`resources/views/inertia_layout.edge`, dentro do `<head>`:

```edge
<link rel="alternate" hreflang="pt-BR" href="{{ site.domain }}/" />
<link rel="alternate" hreflang="en" href="{{ site.domain }}/en" />
<link rel="alternate" hreflang="x-default" href="{{ site.domain }}/" />
```

- [ ] **Step 10: Rodar e confirmar que passa**

Run: `node ace test functional --files=locale.spec.ts`
Esperado: PASS, os cinco testes.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: dois locales por rota com negociação e hreflang"
```

---

### Task 3: Converter a marca para SVG

**Files:**
- Create: `public/brand/logo.svg`
- Create: `public/brand/wordmark.svg`
- Create: `public/favicon.svg`
- Test: `tests/functional/brand.spec.ts`

**Interfaces:**
- Consumes: os três PSD em `Logo, Nome, Textura/`.
- Produces: `/brand/logo.svg` e `/brand/wordmark.svg` servidos estaticamente, ambos com `fill="currentColor"` nas formas que devem herdar cor.

- [ ] **Step 1: Escrever o teste que falha**

`tests/functional/brand.spec.ts`:

```ts
import { test } from '@japa/runner'

test.group('Marca', () => {
  test('logo e wordmark são servidos como SVG', async ({ client, assert }) => {
    for (const path of ['/brand/logo.svg', '/brand/wordmark.svg', '/favicon.svg']) {
      const response = await client.get(path)
      response.assertStatus(200)
      assert.include(response.text(), '<svg')
      assert.notInclude(response.text(), '<image', `${path} contém raster embutido`)
    }
  })
})
```

O `assertNotInclude('<image')` é o que impede alguém de "converter" empacotando o PNG dentro de um SVG.

- [ ] **Step 2: Rodar e confirmar a falha**

Run: `node ace test functional --files=brand.spec.ts`
Esperado: FAIL — 404 nos três caminhos.

- [ ] **Step 3: Extrair os PSD para PNG de referência**

```bash
python3 - <<'EOF'
from PIL import Image, ImageChops
src = "Logo, Nome, Textura"
for name, path in {
    "logo": f"{src}/LOGO/LOGO COMPLETA (COR EDITÁVEL).psd",
    "wordmark": f"{src}/NOME/Nome - Editar Cor.psd",
}.items():
    im = Image.open(path).convert("RGB")
    bg = Image.new("RGB", im.size, (8, 8, 8))
    mask = ImageChops.difference(im, bg).convert("L").point(lambda p: 255 if p > 28 else 0)
    box = mask.getbbox()
    im.crop(box).save(f"tmp/{name}_ref.png")
    print(name, im.crop(box).size)
EOF
```

- [ ] **Step 4: Vetorizar**

Traçar à mão em SVG a partir do PNG de referência. As duas peças são geométricas:

- **logo** — duas chaves pesadas formando o bulbo, uma barra central levemente inclinada como filamento, e a base: três retângulos horizontais de larguras decrescentes mais um triângulo apontando para baixo. Chaves e filamento em `#e8ab30`, base em `#ffffff`.
- **wordmark** — `{dev}eloping` em Poppins ExtraBold com as chaves desenhadas (as chaves do Poppins são leves demais; redesenhar quadradas e pesadas como no PSD). Converter o texto em contornos: o SVG não pode depender de fonte instalada.

`viewBox` justo no conteúdo, sem margem. Nas formas que mudam de cor por contexto, usar `fill="currentColor"`.

- [ ] **Step 5: Gerar o favicon**

`public/favicon.svg` é a logo isolada, sem a base branca, num `viewBox` quadrado com respiro de 8%.

- [ ] **Step 6: Conferir visualmente contra o PSD**

```bash
npm run dev
```

Abrir `http://localhost:3333/brand/logo.svg` lado a lado com `tmp/logo_ref.png` e comparar proporção do bulbo, peso das chaves e espaçamento da base. Ajustar até coincidir.

- [ ] **Step 7: Rodar e confirmar que passa**

Run: `node ace test functional --files=brand.spec.ts`
Esperado: PASS.

- [ ] **Step 8: Commit**

```bash
git add public/brand public/favicon.svg
git commit -m "feat: marca vetorizada em svg a partir dos psd"
```

---

### Task 4: As seções da página

**Files:**
- Create: `inertia/components/nav.tsx`, `hero.tsx`, `manifest_bar.tsx`, `process.tsx`, `services.tsx`, `stack.tsx`, `site_footer.tsx`
- Create: `inertia/lib/i18n.ts`
- Modify: `inertia/pages/landing.tsx`
- Modify: `resources/lang/pt-BR/site.json`, `resources/lang/en/site.json`
- Test: `tests/functional/sections.spec.ts`

**Interfaces:**
- Consumes: props `{ site, locale, messages, alternate }` da Task 2.
- Produces: `useT(): (key: string) => string` de `~/lib/i18n`; cada componente de seção exportado como default, sem props além de children.

- [ ] **Step 1: Escrever o teste que falha**

`tests/functional/sections.spec.ts`:

```ts
import { test } from '@japa/runner'

test.group('Seções', () => {
  test('o português mostra open source depois dos serviços', async ({ client, assert }) => {
    const html = (await client.get('/')).text()
    assert.isBelow(
      html.indexOf('id="servicos"'),
      html.indexOf('id="oss"'),
      'em pt-BR, serviços vem antes de open source'
    )
  })

  test('o inglês mostra open source antes dos serviços', async ({ client, assert }) => {
    const html = (await client.get('/en')).text()
    assert.isBelow(
      html.indexOf('id="oss"'),
      html.indexOf('id="servicos"'),
      'em en, open source vem antes de serviços'
    )
  })

  test('o dispositivo das chaves aparece uma vez só', async ({ client, assert }) => {
    const html = (await client.get('/')).text()
    const matches = html.match(/eloping software/g) ?? []
    assert.lengthOf(matches, 1)
  })

  test('as quatro etapas do processo estão presentes', async ({ client, assert }) => {
    const html = (await client.get('/')).text()
    for (const step of ['Diagnóstico', 'Especificação', 'Construção', 'Operação']) {
      assert.include(html, step)
    }
  })
})
```

- [ ] **Step 2: Rodar e confirmar a falha**

Run: `node ace test functional --files=sections.spec.ts`
Esperado: FAIL — nenhum dos ids existe.

- [ ] **Step 3: Criar o acesso às traduções no cliente**

`inertia/lib/i18n.ts`:

```ts
import { usePage } from '@inertiajs/react'

export function useT() {
  const { messages } = usePage().props as { messages: Record<string, string> }
  return (key: string) => messages[key] ?? key
}

export function useLocale() {
  return (usePage().props as { locale: 'pt-BR' | 'en' }).locale
}

export function useNumber() {
  const locale = useLocale()
  return (n: number) => n.toLocaleString(locale === 'en' ? 'en-US' : 'pt-BR')
}
```

- [ ] **Step 4: Conferir os arquivos de tradução**

`resources/lang/pt-BR/site.json` e `resources/lang/en/site.json` **já estão no repositório**,
com as 82 chaves da copy aprovada extraídas do mockup. Não reescrever. Conferir a simetria:

```bash
node -e "const a=require('./resources/lang/pt-BR/site.json'),b=require('./resources/lang/en/site.json');const d=[...new Set([...Object.keys(a),...Object.keys(b)])].filter(k=>!(k in a)||!(k in b));console.log(d.length?'ASSIMETRIA: '+d:'ok, '+Object.keys(a).length+' chaves')"
```

Esperado: `ok, 82 chaves`.

A Task 2 usava só um subconjunto para o teste de locale; a partir daqui o arquivo inteiro
está em uso.

- [ ] **Step 5: Escrever as seções**

**Referência de implementação:** `docs/superpowers/mockups/landing.html`, versionado no repo.
É o mockup aprovado, com o HTML, o CSS e o comportamento de cada seção já resolvidos. Portar
para componentes React, não redesenhar.

Cada componente vira um arquivo. Regras que não podem ser violadas ao portar:

- ordem por locale via `order` no CSS, com `main` em `flex-direction: column`
- **`.blk-manifest` e `.blk-foot` precisam de `width: 100%`** — são `.shell` direto no flex-column, e sem isso o `margin: 0 auto` vira margem de eixo cruzado, cancela o `stretch` e encolhe o bloco até o texto (o manifesto ficou com 1001px e o rodapé com 728px contra 1180 do resto)
- seletor de idioma **nunca** em âmbar
- CTA sobrevive abaixo de 560px; o que sai é o wordmark, não o botão
- `prefers-reduced-motion` desliga a rolagem do manifesto e o crescimento das barras

- [ ] **Step 6: Montar a página**

`inertia/pages/landing.tsx` importa as seções em ordem e envolve em `<main>`.

- [ ] **Step 7: Rodar e confirmar que passa**

Run: `node ace test functional --files=sections.spec.ts`
Esperado: PASS, os quatro testes.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: seções da landing com ordem por locale"
```

---

### Task 5: Métricas do npm

**Files:**
- Create: `database/migrations/*_create_npm_metrics_table.ts`
- Create: `app/models/npm_metric.ts`
- Create: `app/services/npm_downloads_service.ts`
- Create: `app/jobs/sync_npm_metrics_job.ts`
- Create: `database/data/packages.ts`
- Modify: `start/scheduler.ts`
- Test: `tests/unit/npm_downloads.spec.ts`

**Interfaces:**
- Consumes: nada da Task 4.
- Produces: `NpmMetric` model com `{ id, scope, packageName, downloads, fetchedAt }`; **método de instância** `new NpmDownloadsService(deps?).sync(packages?): Promise<{ updated: number, failed: string[] }>`; **método estático** `NpmDownloadsService.totals(): Promise<{ aviary: number, agora: number, total: number } | null>` — devolve `null` quando não há dado nenhum, para a página omitir a métrica.

- [ ] **Step 1: Escrever o teste que falha**

`tests/unit/npm_downloads.spec.ts`:

```ts
import { test } from '@japa/runner'
import NpmDownloadsService from '#services/npm_downloads_service'
import NpmMetric from '#models/npm_metric'

test.group('NpmDownloadsService', (group) => {
  group.each.setup(async () => {
    await NpmMetric.truncate()
  })

  test('agrega downloads por ecossistema', async ({ assert }) => {
    await NpmMetric.createMany([
      { scope: '@dudousxd', packageName: 'nestjs-telescope', downloads: 100 },
      { scope: '@dudousxd', packageName: 'nestjs-durable', downloads: 50 },
      { scope: '@adonis-agora', packageName: 'authkit-server', downloads: 30 },
    ])

    const totals = await NpmDownloadsService.totals()

    assert.deepEqual(totals, { aviary: 150, agora: 30, total: 180 })
  })

  test('devolve null com a tabela vazia, para a página omitir a métrica', async ({ assert }) => {
    assert.isNull(await NpmDownloadsService.totals())
  })

  test('um pacote que falhou mantém o último valor conhecido', async ({ assert }) => {
    await NpmMetric.create({
      scope: '@dudousxd',
      packageName: 'nestjs-telescope',
      downloads: 999,
    })

    const service = new NpmDownloadsService({
      fetch: async (name: string) => {
        if (name === '@dudousxd/nestjs-telescope') throw new Error('429')
        return 10
      },
    })

    const result = await service.sync([
      { scope: '@dudousxd', packageName: 'nestjs-telescope' },
      { scope: '@dudousxd', packageName: 'nestjs-durable' },
    ])

    const kept = await NpmMetric.findByOrFail('packageName', 'nestjs-telescope')

    assert.equal(kept.downloads, 999, 'não pode zerar o que falhou')
    assert.deepEqual(result.failed, ['@dudousxd/nestjs-telescope'])
    assert.equal(result.updated, 1)
  })

  test('repete com backoff no 429 antes de desistir', async ({ assert }) => {
    let attempts = 0
    const service = new NpmDownloadsService({
      fetch: async () => {
        attempts++
        if (attempts < 3) throw Object.assign(new Error('429'), { status: 429 })
        return 42
      },
      backoffMs: 1,
    })

    await service.sync([{ scope: '@dudousxd', packageName: 'nestjs-telescope' }])

    assert.equal(attempts, 3)
    const row = await NpmMetric.findByOrFail('packageName', 'nestjs-telescope')
    assert.equal(row.downloads, 42)
  })
})
```

- [ ] **Step 2: Rodar e confirmar a falha**

Run: `node ace test unit --files=npm_downloads.spec.ts`
Esperado: FAIL — módulo `#services/npm_downloads_service` não existe.

- [ ] **Step 3: Criar a migration**

```bash
node ace make:migration create_npm_metrics_table
```

```ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'npm_metrics'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('scope').notNullable()
      table.string('package_name').notNullable()
      table.integer('downloads').unsigned().notNullable()
      table.timestamp('fetched_at', { useTz: true }).notNullable()
      table.unique(['scope', 'package_name'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
```

- [ ] **Step 4: Criar o model**

`app/models/npm_metric.ts`:

```ts
import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class NpmMetric extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare scope: string

  @column({ columnName: 'package_name' })
  declare packageName: string

  @column()
  declare downloads: number

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare fetchedAt: DateTime
}
```

- [ ] **Step 5: Listar os pacotes**

`database/data/packages.ts` exporta os 178 pares `{ scope, packageName }`. Gerar a partir dos repositórios:

```bash
python3 - > database/data/packages.ts <<'EOF'
import json, glob
rows = set()
for d in ('nestjs', 'adonis'):
    for pj in glob.glob(f'/home/dudousxd/personal/oss/{d}/*/package.json') + \
              glob.glob(f'/home/dudousxd/personal/oss/{d}/*/packages/*/package.json'):
        if 'node_modules' in pj or 'worktrees' in pj: continue
        try: p = json.load(open(pj))
        except Exception: continue
        if p.get('private') or not p.get('name'): continue
        scope, name = p['name'].split('/')
        rows.add((scope, name))
print('export const PACKAGES = [')
for s, n in sorted(rows):
    print(f"  {{ scope: '{s}', packageName: '{n}' }},")
print('] as const')
EOF
```

- [ ] **Step 6: Escrever o serviço**

`app/services/npm_downloads_service.ts`:

```ts
import { DateTime } from 'luxon'
import NpmMetric from '#models/npm_metric'
import db from '@adonisjs/lucid/services/db'
import { PACKAGES } from '../../database/data/packages.js'

type Pkg = { scope: string; packageName: string }
type Deps = { fetch?: (fullName: string) => Promise<number>; backoffMs?: number }

const AVIARY_SCOPE = '@dudousxd'
const CONCURRENCY = 6
const MAX_ATTEMPTS = 4

async function fetchDownloads(fullName: string): Promise<number> {
  const url = `https://api.npmjs.org/downloads/point/last-month/${fullName}`
  const res = await fetch(url)
  if (!res.ok) throw Object.assign(new Error(`npm ${res.status}`), { status: res.status })
  const body = (await res.json()) as { downloads?: number }
  return body.downloads ?? 0
}

export default class NpmDownloadsService {
  #fetch: (fullName: string) => Promise<number>
  #backoffMs: number

  constructor(deps: Deps = {}) {
    this.#fetch = deps.fetch ?? fetchDownloads
    this.#backoffMs = deps.backoffMs ?? 800
  }

  /**
   * A API do npm responde 429 ao consultar os 178 pacotes de uma vez.
   * Concorrência limitada, backoff exponencial, e resultado parcial é
   * aceitável: pacote que falhou mantém o último valor conhecido, nunca zera.
   */
  async sync(packages: readonly Pkg[] = PACKAGES) {
    const queue = [...packages]
    const failed: string[] = []
    let updated = 0

    const worker = async () => {
      while (queue.length) {
        const pkg = queue.shift()!
        const fullName = `${pkg.scope}/${pkg.packageName}`
        let saved = false

        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
          try {
            const downloads = await this.#fetch(fullName)
            await NpmMetric.updateOrCreate(
              { scope: pkg.scope, packageName: pkg.packageName },
              { downloads, fetchedAt: DateTime.now() }
            )
            updated++
            saved = true
            break
          } catch (error) {
            const retryable = (error as { status?: number }).status === 429 || !('status' in (error as object))
            if (!retryable || attempt === MAX_ATTEMPTS) break
            await new Promise((r) => setTimeout(r, this.#backoffMs * attempt))
          }
        }

        if (!saved) failed.push(fullName)
      }
    }

    await Promise.all(Array.from({ length: CONCURRENCY }, worker))
    return { updated, failed }
  }

  /**
   * null quando não há dado nenhum: a página omite a métrica em vez de
   * estampar zero, que seria pior do que não mostrar.
   */
  static async totals() {
    const rows = await db
      .from('npm_metrics')
      .select('scope')
      .sum('downloads as total')
      .groupBy('scope')

    if (rows.length === 0) return null

    let aviary = 0
    let agora = 0
    for (const row of rows) {
      const total = Number(row.total)
      if (row.scope === AVIARY_SCOPE) aviary += total
      else agora += total
    }

    return { aviary, agora, total: aviary + agora }
  }
}
```

- [ ] **Step 7: Criar o job e agendar**

`app/jobs/sync_npm_metrics_job.ts`:

```ts
import { Job } from '@adonisjs/queue'
import logger from '@adonisjs/core/services/logger'
import NpmDownloadsService from '#services/npm_downloads_service'

export default class SyncNpmMetricsJob extends Job {
  async handle() {
    const { updated, failed } = await new NpmDownloadsService().sync()
    logger.info({ updated, failed: failed.length }, 'métricas do npm sincronizadas')
    if (failed.length) logger.warn({ failed }, 'pacotes sem atualização nesta rodada')
  }
}
```

`start/scheduler.ts` — import estático no topo, nunca dentro do callback:

```ts
import SyncNpmMetricsJob from '#jobs/sync_npm_metrics_job'

await SyncNpmMetricsJob.schedule({}).cron('0 5 * * *').timezone('America/Sao_Paulo').run()
```

- [ ] **Step 8: Rodar e confirmar que passa**

```bash
node ace migration:run
node ace test unit --files=npm_downloads.spec.ts
```

Esperado: PASS, os quatro testes.

- [ ] **Step 9: Popular pela primeira vez**

```bash
node ace repl
> const S = (await import('#services/npm_downloads_service')).default
> await new S().sync()
```

Esperado: `{ updated: 177, failed: [...] }` ou melhor. Levar 3 tentativas com backoff é normal.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: métricas de download do npm por job diário com backoff"
```

---

### Task 6: A seção de open source

**Files:**
- Create: `inertia/components/open_source.tsx`
- Create: `inertia/components/family_chart.tsx`
- Create: `database/data/families.ts`
- Modify: `app/controllers/landing_controller.ts`
- Modify: `inertia/pages/landing.tsx`
- Test: `tests/functional/open_source.spec.ts`

**Interfaces:**
- Consumes: `NpmDownloadsService.totals()` da Task 5; `useT`, `useNumber` da Task 4.
- Produces: prop Inertia `metrics: { aviary: number, agora: number, total: number } | null`; `FAMILIES: { eco: 'aviary' | 'agora', name: string, packages: number }[]`.

- [ ] **Step 1: Escrever o teste que falha**

`tests/functional/open_source.spec.ts`:

```ts
import { test } from '@japa/runner'
import NpmMetric from '#models/npm_metric'

test.group('Open source', (group) => {
  group.each.setup(async () => {
    await NpmMetric.truncate()
  })

  test('as duas escalas do gráfico são compartilhadas', async ({ client, assert }) => {
    const html = (await client.get('/')).text()
    // notifications (27) é o maior de todos: tem que ser o único a 100%.
    const widths = [...html.matchAll(/data-bar-width="([\d.]+)"/g)].map((m) => Number(m[1]))
    assert.equal(Math.max(...widths), 100)
    assert.lengthOf(widths.filter((w) => w === 100), 1)
    // authkit (9) da Agora tem que ser um terço de notifications, não 100%.
    assert.include(html, 'data-family="agora:authkit" data-bar-width="33.33"')
  })

  test('cada família aponta para seus pacotes no npm', async ({ client, assert }) => {
    const html = (await client.get('/')).text()
    assert.include(html, 'npmjs.com/search?q=%40dudousxd%2Fnestjs-telescope')
    assert.include(html, 'npmjs.com/search?q=%40adonis-agora%2Fauthkit')
  })

  test('sem métrica no banco, a página omite downloads em vez de mostrar zero', async ({
    client,
    assert,
  }) => {
    const html = (await client.get('/')).text()
    // Asserção estreita de propósito: a palavra "downloads" aparece em
    // outras strings traduzidas, então checa o elemento da métrica.
    assert.notInclude(html, 'data-metric="downloads"')
    assert.include(html, '178')
  })

  test('com métrica no banco, mostra o total por ecossistema', async ({ client, assert }) => {
    await NpmMetric.createMany([
      { scope: '@dudousxd', packageName: 'nestjs-telescope', downloads: 146393 },
      { scope: '@adonis-agora', packageName: 'authkit-server', downloads: 61367 },
    ])

    const html = (await client.get('/')).text()
    assert.include(html, '146.393')
    assert.include(html, '61.367')
  })
})
```

- [ ] **Step 2: Rodar e confirmar a falha**

Run: `node ace test functional --files=open_source.spec.ts`
Esperado: FAIL — nenhum `data-bar-width` no HTML.

- [ ] **Step 3: Criar os dados das famílias**

`database/data/families.ts` — contagens verificadas em 2026-09-01, somando 147 e 31:

```ts
export const FAMILIES = [
  { eco: 'aviary', name: 'notifications', packages: 27 },
  { eco: 'aviary', name: 'durable', packages: 20 },
  { eco: 'aviary', name: 'telescope', packages: 19 },
  { eco: 'aviary', name: 'media', packages: 16 },
  { eco: 'aviary', name: 'agent', packages: 15 },
  { eco: 'aviary', name: 'catalog', packages: 11 },
  { eco: 'aviary', name: 'authz', packages: 9 },
  { eco: 'aviary', name: 'resilience', packages: 7 },
  { eco: 'aviary', name: 'codegen', packages: 6 },
  { eco: 'aviary', name: 'filter', packages: 6 },
  { eco: 'aviary', name: 'inertia', packages: 6 },
  { eco: 'aviary', name: 'diagnostics', packages: 3 },
  { eco: 'aviary', name: 'context', packages: 2 },
  { eco: 'agora', name: 'authkit', packages: 9 },
  { eco: 'agora', name: 'durable', packages: 3 },
  { eco: 'agora', name: 'media', packages: 3 },
  { eco: 'agora', name: 'payments', packages: 3 },
  { eco: 'agora', name: 'agent', packages: 2 },
  { eco: 'agora', name: 'authz', packages: 2 },
  { eco: 'agora', name: 'collaboration', packages: 2 },
  { eco: 'agora', name: 'filter', packages: 2 },
  { eco: 'agora', name: 'telescope', packages: 2 },
  { eco: 'agora', name: 'context', packages: 1 },
  { eco: 'agora', name: 'diagnostics', packages: 1 },
  { eco: 'agora', name: 'resilience', packages: 1 },
] as const

export type Family = (typeof FAMILIES)[number]
```

- [ ] **Step 4: Entregar métricas como prop**

`app/controllers/landing_controller.ts`, dentro de `show`:

```ts
import NpmDownloadsService from '#services/npm_downloads_service'

// ...
return inertia.render('landing', {
  site: siteConfig,
  locale,
  messages: i18nManager.getTranslationsFor(locale),
  metrics: await NpmDownloadsService.totals(),
  alternate: [
    { locale: 'pt-BR', href: `${siteConfig.domain}/` },
    { locale: 'en', href: `${siteConfig.domain}/en` },
  ],
})
```

- [ ] **Step 5: Escrever o gráfico**

`inertia/components/family_chart.tsx`:

```tsx
import { FAMILIES } from '../../database/data/families.js'

const SCOPE = { aviary: '@dudousxd/nestjs-', agora: '@adonis-agora/' } as const

// Escala compartilhada entre os dois ecossistemas. Se cada um usasse o
// próprio máximo, authkit (9) pareceria do tamanho de notifications (27)
// e o gráfico mentiria.
const MAX = Math.max(...FAMILIES.map((f) => f.packages))

export default function FamilyChart({ eco }: { eco: 'aviary' | 'agora' }) {
  return (
    <div className="flex flex-col gap-0.5">
      {FAMILIES.filter((f) => f.eco === eco).map((f) => {
        const width = Number(((f.packages / MAX) * 100).toFixed(2))
        return (
          <a
            key={f.name}
            href={`https://www.npmjs.com/search?q=${encodeURIComponent(SCOPE[eco] + f.name)}`}
            target="_blank"
            rel="noopener"
            data-family={`${eco}:${f.name}`}
            data-bar-width={width}
            className="group grid grid-cols-[148px_1fr_40px] items-center gap-3.5 py-[3px] no-underline"
          >
            <span className="truncate font-mono text-[13px] text-paper-2 group-hover:text-amber">
              {f.name}
            </span>
            <span className="relative h-[13px]">
              <span
                className={`absolute inset-y-0 left-0 rounded-r ${eco === 'aviary' ? 'bg-amber' : 'bg-paper'}`}
                style={{ width: `${width}%` }}
              />
            </span>
            <span className="text-right font-mono text-[13px] tabular-nums text-paper-3">
              {f.packages}
            </span>
          </a>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 6: Escrever a seção**

`inertia/components/open_source.tsx` monta os dois blocos, cada um com nome, escopo, contagem de famílias e pacotes, o total de downloads em um elemento marcado `data-metric="downloads"` e renderizado **só quando `metrics` não é null**, a nota descritiva, o `FamilyChart` e o link para os docs.

- [ ] **Step 7: Rodar e confirmar que passa**

Run: `node ace test functional --files=open_source.spec.ts`
Esperado: PASS, os quatro testes. O terceiro é o que garante a degradação.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: seção de open source com escala compartilhada e links para o npm"
```

---

### Task 7: O formulário de briefing

**Files:**
- Create: `database/migrations/*_create_briefings_table.ts`
- Create: `app/models/briefing.ts`
- Create: `app/validators/briefing_validator.ts`
- Create: `app/controllers/briefings_controller.ts`
- Create: `app/mails/briefing_received_notification.ts`
- Create: `inertia/components/briefing_form.tsx`
- Modify: `start/routes.ts`, `start/limiter.ts`
- Test: `tests/functional/briefing.spec.ts`

**Interfaces:**
- Consumes: `siteConfig.email` da Task 1.
- Produces: `POST /briefing` (ambos os locales); model `Briefing` com `{ id, name, company, email, phone, serviceType, budgetRange, message, createdAt, updatedAt }`.

- [ ] **Step 1: Escrever o teste que falha**

`tests/functional/briefing.spec.ts`:

```ts
import { test } from '@japa/runner'
import mail from '@adonisjs/mail/services/main'
import Briefing from '#models/briefing'
import BriefingReceivedNotification from '#mails/briefing_received_notification'

const valid = {
  name: 'Ana Ribeiro',
  company: 'Acme',
  email: 'ana@acme.com',
  service_type: 'arquitetura',
  message: 'Sistema legado em PHP que não escala mais.',
}

test.group('Briefing', (group) => {
  group.each.setup(async () => {
    await Briefing.truncate()
  })

  test('grava o lead e dispara a notificação', async ({ client, assert }) => {
    const { mails } = mail.fake()

    await client.post('/briefing').form(valid).withCsrfToken()

    const saved = await Briefing.firstOrFail()
    assert.equal(saved.email, 'ana@acme.com')
    assert.equal(saved.serviceType, 'arquitetura')
    mails.assertSent(BriefingReceivedNotification)
    mail.restore()
  })

  test('rejeita entrada inválida sem gravar nada', async ({ client, assert }) => {
    const response = await client
      .post('/briefing')
      .form({ ...valid, email: 'não-é-email' })
      .withCsrfToken()

    response.assertStatus(422)
    assert.equal(await Briefing.query().count('* as total').firstOrFail().then((r) => Number(r.$extras.total)), 0)
  })

  test('o honeypot preenchido é descartado em silêncio', async ({ client, assert }) => {
    const response = await client
      .post('/briefing')
      .form({ ...valid, website: 'http://spam.example' })
      .withCsrfToken()

    response.assertStatus(302)
    const count = await Briefing.query().count('* as total').firstOrFail()
    assert.equal(Number(count.$extras.total), 0)
  })

  test('falha de SMTP não perde o lead', async ({ client, assert }) => {
    const { mails } = mail.fake()
    mails.trap(() => {
      throw new Error('SMTP fora do ar')
    })

    const response = await client.post('/briefing').form(valid).withCsrfToken()

    response.assertStatus(302)
    const saved = await Briefing.firstOrFail()
    assert.equal(saved.email, 'ana@acme.com')
    mail.restore()
  })

  test('o rate limit corta a partir da sexta tentativa', async ({ client }) => {
    for (let i = 0; i < 5; i++) {
      await client.post('/briefing').form({ ...valid, email: `a${i}@acme.com` }).withCsrfToken()
    }
    const response = await client.post('/briefing').form(valid).withCsrfToken()
    response.assertStatus(429)
  })
})
```

O quarto teste é o mais importante: perder lead porque o e-mail não saiu é o erro caro.

- [ ] **Step 2: Rodar e confirmar a falha**

Run: `node ace test functional --files=briefing.spec.ts`
Esperado: FAIL — rota `/briefing` inexistente.

- [ ] **Step 3: Criar a migration**

```bash
node ace make:migration create_briefings_table
```

```ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'briefings'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.string('company').notNullable()
      table.string('email').notNullable()
      table.string('phone').nullable()
      table.string('service_type').notNullable()
      table.string('budget_range').nullable()
      table.text('message').notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      table.index(['created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
```

- [ ] **Step 4: Criar o model**

`app/models/briefing.ts`:

```ts
import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Briefing extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare company: string

  @column()
  declare email: string

  @column()
  declare phone: string | null

  @column({ columnName: 'service_type' })
  declare serviceType: string

  @column({ columnName: 'budget_range' })
  declare budgetRange: string | null

  @column()
  declare message: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
```

- [ ] **Step 5: Criar o validador**

`app/validators/briefing_validator.ts`:

```ts
import vine from '@vinejs/vine'

export const briefingValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(120),
    company: vine.string().trim().minLength(2).maxLength(160),
    email: vine.string().trim().email().maxLength(254),
    phone: vine.string().trim().maxLength(40).optional(),
    service_type: vine.enum(['arquitetura', 'projeto', 'suporte']),
    budget_range: vine.enum(['', 't1', 't2', 't3', 't4']).optional(),
    message: vine.string().trim().minLength(20).maxLength(4000),
  })
)
```

- [ ] **Step 6: Criar a notificação**

`app/mails/briefing_received_notification.ts`:

```ts
import { BaseMail } from '@adonisjs/mail'
import { siteConfig } from '#config/site'
import type Briefing from '#models/briefing'

export default class BriefingReceivedNotification extends BaseMail {
  constructor(private briefing: Briefing) {
    super()
  }

  prepare() {
    this.message
      .to(siteConfig.email)
      .replyTo(this.briefing.email)
      .subject(`Briefing · ${this.briefing.company} · ${this.briefing.serviceType}`)
      .text(
        [
          `Nome:     ${this.briefing.name}`,
          `Empresa:  ${this.briefing.company}`,
          `E-mail:   ${this.briefing.email}`,
          `Telefone: ${this.briefing.phone ?? '—'}`,
          `Serviço:  ${this.briefing.serviceType}`,
          `Orçamento:${this.briefing.budgetRange ?? '—'}`,
          '',
          this.briefing.message,
        ].join('\n')
      )
  }
}
```

- [ ] **Step 7: Criar o controller**

`app/controllers/briefings_controller.ts`:

```ts
import type { HttpContext } from '@adonisjs/core/http'
import mail from '@adonisjs/mail/services/main'
import logger from '@adonisjs/core/services/logger'
import Briefing from '#models/briefing'
import BriefingReceivedNotification from '#mails/briefing_received_notification'
import { briefingValidator } from '#validators/briefing_validator'

export default class BriefingsController {
  async store({ request, response, session }: HttpContext) {
    // Honeypot: bot preencheu o campo escondido. Responde como sucesso para
    // não ensinar o que foi detectado, e não grava nada.
    if (request.input('website')) {
      return response.redirect().back()
    }

    const payload = await request.validateUsing(briefingValidator)

    const briefing = await Briefing.create({
      name: payload.name,
      company: payload.company,
      email: payload.email,
      phone: payload.phone ?? null,
      serviceType: payload.service_type,
      budgetRange: payload.budget_range || null,
      message: payload.message,
    })

    // O banco é a fonte da verdade; o e-mail é só o alerta. Se o SMTP cair
    // depois do commit, o lead já está salvo e o usuário vê sucesso.
    try {
      await mail.send(new BriefingReceivedNotification(briefing))
    } catch (error) {
      logger.error({ err: error, briefingId: briefing.id }, 'notificação de briefing falhou')
    }

    session.flash('briefing', 'sent')
    return response.redirect().back()
  }
}
```

- [ ] **Step 8: Registrar rota e rate limit**

`start/limiter.ts`:

```ts
import limiter from '@adonisjs/limiter/services/main'

export const briefingThrottle = limiter.define('briefing', () => {
  return limiter.allowRequests(5).every('1 hour').blockFor('1 hour')
})
```

`start/routes.ts`:

```ts
import { briefingThrottle } from '#start/limiter'

const BriefingsController = () => import('#controllers/briefings_controller')

router.post('/briefing', [BriefingsController, 'store']).use(briefingThrottle).as('briefing.store')
```

- [ ] **Step 9: Escrever o formulário**

`inertia/components/briefing_form.tsx` usa `useForm` do Inertia, com o campo honeypot `website` posicionado fora da tela (`absolute left-[-9999px]`), `tabIndex={-1}` e `autoComplete="off"`. Ao receber o flash `briefing === 'sent'`, esconde o formulário e mostra o estado de sucesso. Todos os rótulos vêm de `useT()`.

- [ ] **Step 10: Rodar e confirmar que passa**

```bash
node ace migration:run
node ace test functional --files=briefing.spec.ts
```

Esperado: PASS, os cinco testes.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: briefing gravando em banco e notificando por e-mail"
```

---

### Task 8: SEO e deploy

**Files:**
- Create: `app/controllers/seo_controller.ts`
- Create: `inertia/components/head_tags.tsx`
- Create: `Dockerfile`, `.dockerignore`
- Modify: `start/routes.ts`, `resources/views/inertia_layout.edge`
- Test: `tests/functional/seo.spec.ts`

**Interfaces:**
- Consumes: `siteConfig` da Task 1; rotas de locale da Task 2.
- Produces: `GET /sitemap.xml`, `GET /robots.txt`.

- [ ] **Step 1: Escrever o teste que falha**

`tests/functional/seo.spec.ts`:

```ts
import { test } from '@japa/runner'

test.group('SEO', () => {
  test('o sitemap lista os dois locales', async ({ client, assert }) => {
    const response = await client.get('/sitemap.xml')
    response.assertStatus(200)
    response.assertHeader('content-type', 'application/xml; charset=utf-8')
    assert.include(response.text(), '<loc>https://developing.com.br/</loc>')
    assert.include(response.text(), '<loc>https://developing.com.br/en</loc>')
  })

  test('o robots aponta para o sitemap', async ({ client, assert }) => {
    const response = await client.get('/robots.txt')
    response.assertStatus(200)
    assert.include(response.text(), 'Sitemap: https://developing.com.br/sitemap.xml')
  })

  test('a página traz JSON-LD de Organization com o CNPJ', async ({ client, assert }) => {
    const html = (await client.get('/')).text()
    assert.include(html, 'application/ld+json')
    assert.include(html, '"@type":"Organization"')
    assert.include(html, '39.598.365/0001-03')
  })

  test('cada locale declara og:locale próprio', async ({ client, assert }) => {
    assert.include((await client.get('/')).text(), 'property="og:locale" content="pt_BR"')
    assert.include((await client.get('/en')).text(), 'property="og:locale" content="en_US"')
  })
})
```

- [ ] **Step 2: Rodar e confirmar a falha**

Run: `node ace test functional --files=seo.spec.ts`
Esperado: FAIL — `/sitemap.xml` responde 404.

- [ ] **Step 3: Criar o controller de SEO**

`app/controllers/seo_controller.ts`:

```ts
import type { HttpContext } from '@adonisjs/core/http'
import { siteConfig } from '#config/site'

export default class SeoController {
  async sitemap({ response }: HttpContext) {
    const urls = [`${siteConfig.domain}/`, `${siteConfig.domain}/en`]
    const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls
  .map(
    (loc) => `  <url>
    <loc>${loc}</loc>
    <xhtml:link rel="alternate" hreflang="pt-BR" href="${siteConfig.domain}/" />
    <xhtml:link rel="alternate" hreflang="en" href="${siteConfig.domain}/en" />
  </url>`
  )
  .join('\n')}
</urlset>`

    return response.header('content-type', 'application/xml; charset=utf-8').send(body)
  }

  async robots({ response }: HttpContext) {
    return response
      .header('content-type', 'text/plain; charset=utf-8')
      .send(`User-agent: *\nAllow: /\n\nSitemap: ${siteConfig.domain}/sitemap.xml\n`)
  }
}
```

- [ ] **Step 4: Registrar as rotas**

`start/routes.ts`:

```ts
const SeoController = () => import('#controllers/seo_controller')

router.get('/sitemap.xml', [SeoController, 'sitemap'])
router.get('/robots.txt', [SeoController, 'robots'])
```

- [ ] **Step 5: Emitir meta tags e JSON-LD**

`inertia/components/head_tags.tsx` usa `<Head>` do Inertia para title, description, `og:*`, `twitter:*` e o bloco JSON-LD:

```tsx
const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: site.legalName,
  url: site.domain,
  logo: `${site.domain}/brand/logo.svg`,
  taxID: site.cnpj,
  sameAs: [site.docs.aviary, site.docs.agora],
}
```

`og:locale` é `pt_BR` ou `en_US` conforme a prop `locale`.

- [ ] **Step 6: Gerar a imagem OG**

`public/og.png`, 1200×630, fundo `#080808`, wordmark centralizado à esquerda e a linha de manifesto em mono. Referenciar em `og:image` com `og:image:width` e `og:image:height` declarados.

- [ ] **Step 7: Escrever o Dockerfile**

```dockerfile
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
```

- [ ] **Step 8: Rodar a suíte inteira**

```bash
node ace test
npx tsc --noEmit
node ace build
```

Esperado: todos os testes passam, sem erro de tipo, build conclui.

```bash
test -f build/ssr/ssr.js && echo "bundle de SSR presente"
```

Se o build falhar com erro mencionando `viteMetadata`, o guard de `configEnvironment` do
Step 11 da Task 1 não está ativo, ou alguém colocou `@font-face` de volta no `app.css`.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: seo com sitemap, hreflang e json-ld, e dockerfile de produção"
```

---

## Pendências que bloqueiam o deploy, não o desenvolvimento

Todas entram em `config/site.ts` ou no ambiente:

- `LT` ou `LTDA` na razão social — confirmar antes de subir, fica ao lado do CNPJ no rodapé
- e-mail de contato que recebe a notificação de briefing
- telefone, se for aparecer no rodapé
- domínio de produção (o plano usa `developing.com.br` como placeholder, e os testes de SEO comparam contra ele — trocar nos dois lugares juntos)
- credenciais SMTP de produção

## Fora deste plano, mas vale fazer

- `@dudousxd/nestjs-resilience` está sem `license` e sem `description` no `package.json` — é o único dos 178. Corrigir antes de a página afirmar "100% MIT".
- O site do Aviary publica "119+ pacotes" e "12 famílias"; o real é 147 e 13, porque `catalog` não aparece lá. Deixa o mesmo ecossistema com números diferentes em duas páginas suas.
