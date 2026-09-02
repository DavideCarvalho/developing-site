import env from '#start/env'
import { defineConfig, transports } from '@adonisjs/mail'

const mailConfig = defineConfig({
  default: env.get('MAIL_MAILER'),

  /**
   * The mailers object can be used to configure multiple mailers
   * each using a different transport or same transport with different
   * options.
   */
  from: {
    address: env.get('MAIL_FROM_ADDRESS'),
    name: env.get('MAIL_FROM_NAME'),
  },

  /**
   * The globals are shared with all the templates rendered using the
   * configured template engine.
   *
   * This could be a nice place to define the logo URL, links base URL
   * the brand name to be used within the emails
   */
  globals: {
    brandName: 'Developing',
  },

  /**
   * The mailers object can be used to configure multiple mailers
   * each using a different transport or same transport with different
   * options.
   */
  mailers: {
    /**
     * SMTP_USERNAME/SMTP_PASSWORD são opcionais: um relay local sem auth
     * (ex.: Mailpit em dev) continua funcionando sem eles. Um provedor real
     * em produção (SendGrid, SES, Postmark...) exige os dois — sem isso o
     * e-mail de notificação do briefing falha em silêncio (o lead já foi
     * salvo antes do envio, então ninguém vê erro nenhum, só o e-mail nunca
     * chega). Ver BriefingsController#store.
     */
    smtp: transports.smtp({
      host: env.get('SMTP_HOST'),
      port: env.get('SMTP_PORT'),
      ...(env.get('SMTP_USERNAME') && env.get('SMTP_PASSWORD')
        ? {
            auth: {
              type: 'login',
              user: env.get('SMTP_USERNAME')!,
              pass: env.get('SMTP_PASSWORD')!,
            },
          }
        : {}),
    }),
  },
})

export default mailConfig

declare module '@adonisjs/mail/types' {
  export interface MailersList extends InferMailers<typeof mailConfig> {}
}