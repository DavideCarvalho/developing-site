import { test } from '@japa/runner'
import mail from '@adonisjs/mail/services/main'
import { FakeMailer } from '@adonisjs/mail'
import db from '@adonisjs/lucid/services/db'
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
    // O limiter usa a mesma tabela entre execuções de teste e entre testes
    // desta suíte: sem isso, contagens de uma tentativa anterior vazam para
    // o próximo teste e o de rate limit trava os outros com 429 indevido.
    await db.from('rate_limits').delete()
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
    // @adonisjs/session sobrescreve globalmente o renderer HTML de
    // ValidationException para sempre fazer redirect-back com os erros
    // flashados na sessão (é assim que o useForm do Inertia consome erro de
    // validação — não como um 422 bruto). O client segue redirect por
    // padrão, por isso .redirects(0) para inspecionar a resposta real.
    const response = await client
      .post('/briefing')
      .form({ ...valid, email: 'não-é-email' })
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)
    assert.equal(
      await Briefing.query()
        .count('* as total')
        .firstOrFail()
        .then((r) => Number(r.$extras.total)),
      0
    )
  })

  test('o honeypot preenchido é descartado em silêncio', async ({ client, assert }) => {
    const response = await client
      .post('/briefing')
      .form({ ...valid, website: 'http://spam.example' })
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)
    const count = await Briefing.query().count('* as total').firstOrFail()
    assert.equal(Number(count.$extras.total), 0)
  })

  test('falha de SMTP não perde o lead', async ({ client, assert }) => {
    // @adonisjs/mail 10.x não tem um "trap" pronto para forçar falha no envio
    // dentro do fake mailer; simulamos a queda do SMTP substituindo o
    // FakeMailer.prototype.send por uma versão que lança, e restauramos no
    // finally para não vazar o mock para os outros testes.
    mail.fake()
    const originalSend = FakeMailer.prototype.send
    FakeMailer.prototype.send = async () => {
      throw new Error('SMTP fora do ar')
    }

    try {
      const response = await client.post('/briefing').form(valid).withCsrfToken().redirects(0)

      response.assertStatus(302)
      const saved = await Briefing.firstOrFail()
      assert.equal(saved.email, 'ana@acme.com')
    } finally {
      FakeMailer.prototype.send = originalSend
      mail.restore()
    }
  })

  test('o rate limit corta a partir da sexta tentativa', async ({ client }) => {
    for (let i = 0; i < 5; i++) {
      await client
        .post('/briefing')
        .form({ ...valid, email: `a${i}@acme.com` })
        .withCsrfToken()
    }
    const response = await client.post('/briefing').form(valid).withCsrfToken()
    response.assertStatus(429)
  })
})
