import app from '@adonisjs/core/services/app'
import { errors as limiterErrors } from '@adonisjs/limiter'
import { CANONICAL_PATH } from '#middleware/locale_middleware'
import { type HttpContext, ExceptionHandler } from '@adonisjs/core/http'
import type { HttpError, StatusPageRange, StatusPageRenderer } from '@adonisjs/core/types/http'

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
        return this.#backToLocale(ctx)
      }
    }

    /**
     * @adonisjs/session sobrescreve renderValidationErrorAsHTML pra sempre
     * fazer redirect-back com os erros flashados (é assim que o useForm do
     * Inertia consome erro de validação, não como 422 bruto — ver
     * app/middleware/locale_middleware.ts). Só que o patch deles usa
     * `.back()`, que sem Referer cai na raiz "/" — e a raiz pode
     * redirecionar de novo por causa do cookie de locale, consumindo o
     * flash no meio do caminho antes da página certa renderizar. Mesmo bug
     * do throttle acima, caminho diferente: reproduz o comportamento deles
     * (flashValidationErrors, mesma regra de withInput por X-Inertia), só
     * trocando o alvo do redirect por um explícito.
     */
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'E_VALIDATION_ERROR' &&
      'messages' in error &&
      ctx.session
    ) {
      const negotiated = ctx.request.accepts(['html', 'application/vnd.api+json', 'json'])
      if (negotiated === 'html' || negotiated === null) {
        const withInput = ctx.request.header('X-Inertia') ? false : true
        ctx.session.flashValidationErrors(error as HttpError, withInput)
        return this.#backToLocale(ctx)
      }
    }

    return super.handle(error, ctx)
  }

  /**
   * Volta pro locale já resolvido pela rota (ex.: /briefing, ver
   * start/routes.ts) em vez de `.back()` — não depende do Referer do
   * navegador. Uma rota que dispara essas exceções sem ter resolvido
   * ctx.locale cai no `.back()` normal, igual antes.
   */
  #backToLocale(ctx: HttpContext) {
    if (ctx.locale) return ctx.response.redirect().toPath(CANONICAL_PATH[ctx.locale])
    return ctx.response.redirect().back()
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
