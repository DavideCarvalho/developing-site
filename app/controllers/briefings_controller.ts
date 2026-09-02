import type { HttpContext } from '@adonisjs/core/http'
import mail from '@adonisjs/mail/services/main'
import logger from '@adonisjs/core/services/logger'
import i18nManager from '@adonisjs/i18n/services/main'
import Briefing from '#models/briefing'
import BriefingReceivedNotification from '#mails/briefing_received_notification'
import { briefingValidator } from '#validators/briefing_validator'
import { resolveLocale } from '#middleware/locale_middleware'

export default class BriefingsController {
  async store(ctx: HttpContext) {
    const { request, response, session } = ctx

    // Honeypot: bot preencheu o campo escondido. Responde como sucesso para
    // não ensinar o que foi detectado, e não grava nada.
    if (request.input('website')) {
      return response.redirect().back()
    }

    // /briefing atende as duas páginas com um único endpoint (sem prefixo de
    // locale na URL), então roda sem o LocaleMiddleware — que redireciona em
    // GET. Aqui só precisamos do locale para localizar as mensagens de
    // validação; resolveLocale não tem esse efeito colateral de redirect.
    ctx.i18n = i18nManager.locale(resolveLocale(ctx))

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
