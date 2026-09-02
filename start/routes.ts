/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import i18nManager from '@adonisjs/i18n/services/main'
import { middleware } from '#start/kernel'
import { briefingThrottle } from '#start/limiter'
import { resolveLocale } from '#middleware/locale_middleware'

const LandingController = () => import('#controllers/landing_controller')
const BriefingsController = () => import('#controllers/briefings_controller')
const SeoController = () => import('#controllers/seo_controller')

router.get('/sitemap.xml', [SeoController, 'sitemap']).as('seo.sitemap')
router.get('/robots.txt', [SeoController, 'robots']).as('seo.robots')

router.get('/', [LandingController, 'show']).use(middleware.locale()).as('landing.pt')
router
  .get('/en', [LandingController, 'show'])
  .use(middleware.locale({ locale: 'en' }))
  .as('landing.en')

router
  .post('/briefing', [BriefingsController, 'store'])
  .use(async (ctx, next) => {
    // /briefing atende as duas páginas com um único endpoint (sem prefixo de
    // locale na URL), então não roda o LocaleMiddleware — que redireciona em
    // GET, o que quebraria um POST. Precisa rodar ANTES do throttle: o
    // ThrottleException é lançado pelo próprio middleware de rate limit,
    // antes do controller, e a mensagem de "muitas tentativas" só sai
    // localizada (handler.ts) se ctx.i18n/ctx.locale já existirem nesse
    // ponto. ctx.locale também é o que o controller e o handler usam para
    // voltar pra `/` ou `/en` explicitamente — sem depender do Referer do
    // navegador (response.redirect().back() com Referer ausente bate na
    // raiz, que pode redirecionar de novo por causa do cookie, e o segundo
    // pulo consome o flash antes da página certa renderizar).
    ctx.locale = resolveLocale(ctx)
    ctx.i18n = i18nManager.locale(ctx.locale)
    return next()
  })
  .use(briefingThrottle)
  .as('briefing.store')
