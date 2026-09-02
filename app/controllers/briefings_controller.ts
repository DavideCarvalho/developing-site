import type { HttpContext } from '@adonisjs/core/http'
import mail from '@adonisjs/mail/services/main'
import logger from '@adonisjs/core/services/logger'
import Briefing from '#models/briefing'
import BriefingReceivedNotification from '#mails/briefing_received_notification'
import { briefingValidator } from '#validators/briefing_validator'
import { CANONICAL_PATH } from '#middleware/locale_middleware'

export default class BriefingsController {
  async store(ctx: HttpContext) {
    const { request, response, session } = ctx
    // Volta pra `/` ou `/en` explicitamente (não .back()): sem Referer, back()
    // cairia na raiz, que pode redirecionar de novo por causa do cookie de
    // locale — e esse segundo pulo consome o flash antes da página certa
    // renderizar. Ver o comentário em start/routes.ts.
    const back = () => response.redirect().toPath(CANONICAL_PATH[ctx.locale])

    // Honeypot: bot preencheu o campo escondido. A resposta precisa ser
    // idêntica à de sucesso — mesmo status, mesmo redirect, mesmo flash —
    // senão qualquer coisa que siga o redirect consegue distinguir "aceito"
    // de "rejeitado em silêncio" pela página que vem depois. Não grava nada.
    if (request.input('website')) {
      session.flash('briefing', 'sent')
      return back()
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
    return back()
  }
}
