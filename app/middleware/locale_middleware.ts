import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { I18n } from '@adonisjs/i18n'
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
    i18n: I18n
    locale: Locale
  }
}
