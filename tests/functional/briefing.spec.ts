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

  test('mensagem de validação sai em português por padrão', async ({ client, assert }) => {
    // Segue o redirect (sem .redirects(0)) pra pegar a página renderizada de
    // verdade — e a asserção usa a tag em volta da mensagem, não só o texto
    // solto, porque o texto sozinho também aparece no blob de props do
    // Inertia independentemente do que foi de fato pro DOM. Sem Referer de
    // propósito: o handler (app/exceptions/handler.ts) volta pro locale
    // resolvido em ctx.locale, não pro que o navegador mandou — um teste
    // que só passasse com um Referer simulado estaria testando em volta do
    // bug, não contra ele.
    const response = await client
      .post('/briefing')
      .form({ ...valid, email: 'não-é-email' })
      .withCsrfToken()

    assert.include(
      response.text(),
      '<span class="field-error">O campo e-mail deve ser um e-mail válido.</span>'
    )
  })

  test('mensagem de validação sai em inglês quando o locale é en', async ({ client, assert }) => {
    // Também sem Referer: é exatamente o cenário que quebrava antes do
    // fix — um navegador com Referrer-Policy restritiva, ou qualquer
    // cliente que simplesmente não manda o header, ainda precisa ver o
    // erro traduzido na própria página, não sumir em silêncio.
    const response = await client
      .post('/briefing')
      .form({ ...valid, email: 'não-é-email' })
      .withCsrfToken()
      .withCookie('locale', 'en')

    assert.include(
      response.text(),
      '<span class="field-error">The email field must be a valid email address.</span>'
    )
  })

  test('o honeypot preenchido finge sucesso e não grava nada', async ({ client, assert }) => {
    // A resposta ao bot precisa ser indistinguível da de um envio de
    // verdade: mesmo redirect, mesmo flash, mesma página de sucesso
    // renderizada depois — senão dá pra detectar a armadilha pelo que vem
    // depois do redirect. Segue o redirect (sem .redirects(0)) e confere a
    // marcação real do estado de sucesso, não só o flash cru.
    const response = await client
      .post('/briefing')
      .form({ ...valid, website: 'http://spam.example' })
      .withCsrfToken()

    assert.include(response.text(), '<h3>Briefing recebido.</h3>')
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

  test('o rate limit devolve o visitante ao formulário com mensagem legível', async ({
    client,
    assert,
  }) => {
    // Quem bate nesse limite quase sempre não é bot — é um escritório
    // inteiro atrás do mesmo IP mandando briefings na mesma tarde. O 429
    // cru do @adonisjs/limiter (texto solto em inglês, sem redirect) não
    // pode escapar: o visitante precisa voltar pro formulário com uma
    // mensagem localizada, no mesmo formato de um erro de validação.
    for (let i = 0; i < 5; i++) {
      await client
        .post('/briefing')
        .form({ ...valid, email: `a${i}@acme.com` })
        .withCsrfToken()
    }
    const response = await client.post('/briefing').form(valid).withCsrfToken()

    assert.notInclude(response.text(), 'Too many requests')
    assert.include(
      response.text(),
      '<p class="form-error" role="alert">Muitas tentativas em pouco tempo. Aguarde um pouco e tente enviar de novo.</p>'
    )
  })

  test('o rate limit também devolve pro /en, localizado', async ({ client, assert }) => {
    // Sem locale resolvido explicitamente (handler.ts), o redirect do
    // throttle cairia em .back() → sem Referer, na raiz "/" → que redireciona
    // de novo pro /en por causa do cookie, consumindo o flash no meio do
    // caminho. Este teste cobre exatamente o locale onde esse bug apareceria.
    for (let i = 0; i < 5; i++) {
      await client
        .post('/briefing')
        .form({ ...valid, email: `b${i}@acme.com` })
        .withCsrfToken()
        .withCookie('locale', 'en')
    }
    const response = await client
      .post('/briefing')
      .form(valid)
      .withCsrfToken()
      .withCookie('locale', 'en')

    assert.include(
      response.text(),
      '<p class="form-error" role="alert">Too many attempts in a short time. Please wait a bit and try sending again.</p>'
    )
  })
})
