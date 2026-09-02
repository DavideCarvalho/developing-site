import { I18n } from '@adonisjs/i18n'
import i18nManager from '@adonisjs/i18n/services/main'
import type { NextFn } from '@adonisjs/core/types/http'
import { type HttpContext, RequestValidator } from '@adonisjs/core/http'

const SUPPORTED = ['pt-BR', 'en'] as const
export type Locale = (typeof SUPPORTED)[number]

const CANONICAL_PATH: Record<Locale, string> = {
  'pt-BR': '/',
  'en': '/en',
}

function isSupported(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED as readonly string[]).includes(value)
}

/**
 * Resolve o locale a partir do cookie/Accept-Language sem os efeitos
 * colaterais de `handle()` (gravar cookie, redirecionar). Usado por rotas
 * como POST /briefing, que atendem os dois locales num único endpoint e não
 * podem virar um redirect no meio de um submit — perderia o corpo do POST.
 */
export function resolveLocale(ctx: HttpContext): Locale {
  const cookie = ctx.request.cookie('locale')
  if (isSupported(cookie)) return cookie
  return ctx.request.language([...SUPPORTED]) === 'en' ? 'en' : 'pt-BR'
}

export default class LocaleMiddleware {
  /**
   * Using i18n for validation messages. Applicable to only
   * "request.validateUsing" method calls.
   */
  static {
    RequestValidator.messagesProvider = (ctx) => {
      return ctx.i18n.createMessagesProvider()
    }
  }

  async handle(ctx: HttpContext, next: NextFn, options: { locale?: Locale } = {}) {
    // A rota é a única autoridade sobre o que renderiza. O cookie só decide se
    // a raiz redireciona; ele nunca troca o idioma que uma URL entrega.
    const routeLocale = options.locale

    // Troca explícita: ?lang=pt-BR (ou ?lang=en) grava o cookie e redireciona
    // para a URL canônica sem o query param.
    const requestedLang = ctx.request.qs().lang
    if (isSupported(requestedLang)) {
      ctx.response.cookie('locale', requestedLang)
      // A app força forwardQueryString por padrão (config/app.ts); aqui a URL
      // canônica precisa ficar limpa, sem o ?lang= de volta.
      return ctx.response.redirect().withQs(false).toPath(CANONICAL_PATH[requestedLang])
    }

    let locale: Locale

    if (routeLocale) {
      // /en é sempre inglês, e confirma a escolha via cookie para próximas visitas.
      locale = routeLocale
      ctx.response.cookie('locale', locale)
    } else {
      // / só negocia: nunca grava o cookie num render comum, senão suprime
      // permanentemente a negociação por Accept-Language de quem cai aqui pela
      // primeira vez.
      const rawCookie = ctx.request.cookie('locale')
      // Um cookie fora da lista suportada ('fr', 'en-GB', lixo) não conta como
      // escolha: é tratado como se não houvesse cookie, e a negociação roda normal.
      const cookie = isSupported(rawCookie) ? rawCookie : undefined
      if (cookie === 'en') {
        return ctx.response.redirect('/en')
      }
      if (!cookie) {
        const negotiated = ctx.request.language([...SUPPORTED])
        if (negotiated === 'en') {
          return ctx.response.redirect('/en')
        }
      }
      locale = 'pt-BR'
    }

    ctx.i18n = i18nManager.locale(locale)
    ctx.locale = locale

    /**
     * Binding I18n class to the request specific instance of it, so it can be
     * resolved by the IoC container elsewhere in the request lifecycle.
     */
    ctx.containerResolver.bindValue(I18n, ctx.i18n)

    /**
     * Sharing the request specific instance of i18n with Edge templates.
     */
    if ('view' in ctx) {
      ctx.view.share({ i18n: ctx.i18n })
    }

    return next()
  }
}

declare module '@adonisjs/core/http' {
  interface HttpContext {
    i18n: I18n
    locale: Locale
  }
}
