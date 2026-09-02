import app from '@adonisjs/core/services/app'
import { errors as limiterErrors } from '@adonisjs/limiter'
import { CANONICAL_PATH } from '#middleware/locale_middleware'
import { type HttpContext, ExceptionHandler } from '@adonisjs/core/http'
import type { StatusPageRange, StatusPageRenderer } from '@adonisjs/core/types/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  /**
   * In debug mode, the exception handler will display verbose errors
   * with pretty printed stack traces.
   */
  protected debug = !app.inProduction

  /**
   * Status pages are used to display a custom HTML pages for certain error
   * codes. You might want to enable them in production only, but feel
   * free to enable them in development as well.
   */
  protected renderStatusPages = app.inProduction

  /**
   * Status pages is a collection of error code range and a callback
   * to return the HTML contents to send as a response.
   */
  protected statusPages: Record<StatusPageRange, StatusPageRenderer> = {
    '404': (_, { inertia }) => inertia.render('errors/not_found', {}),
    '500..599': (_, { inertia }) => inertia.render('errors/server_error', {}),
  }

  /**
   * The method is used for handling errors and returning
   * response to the client
   */
  async handle(error: unknown, ctx: HttpContext) {
    /**
     * Um 429 cru (o default do @adonisjs/limiter para requests HTML: só
     * texto em inglês, sem X-Inertia, sem redirect) joga o visitante numa
     * página fora do ar da marca e do locale. Quem bate nesse limite quase
     * sempre não é um bot — é um escritório inteiro atrás do mesmo IP
     * enviando briefings na mesma tarde. Trata como um erro de validação:
     * flasha uma mensagem localizada e volta pra página, no mesmo formato
     * que o visitante já vê quando erra um campo do formulário.
     */
    if (error instanceof limiterErrors.ThrottleException && ctx.session) {
      const negotiated = ctx.request.accepts(['html', 'application/vnd.api+json', 'json'])
      if (negotiated === 'html' || negotiated === null) {
        ctx.session.flash('error', error.getResponseMessage(ctx))
        // Prefere o locale já resolvido pela rota (ex.: /briefing, ver
        // start/routes.ts) — evita o mesmo bug de .back() sem Referer que
        // faz a raiz redirecionar de novo e consumir o flash no caminho.
        // Uma rota futura com throttle mas sem locale resolvido cai no
        // .back() normal.
        if (ctx.locale) return ctx.response.redirect().toPath(CANONICAL_PATH[ctx.locale])
        return ctx.response.redirect().back()
      }
    }

    return super.handle(error, ctx)
  }

  /**
   * The method is used to report error to the logging service or
   * the a third party error monitoring service.
   *
   * @note You should not attempt to send a response from this method.
   */
  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }
}
