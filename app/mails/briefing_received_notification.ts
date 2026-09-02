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
