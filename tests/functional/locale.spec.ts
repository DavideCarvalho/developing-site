import { test } from '@japa/runner'

test.group('Locale', () => {
  test('a raiz entrega português', async ({ client, assert }) => {
    const response = await client.get('/')
    response.assertStatus(200)
    // Assertar só a frase pegaria o blob de props do Inertia, onde a copy
    // inteira viaja como JSON independentemente do que foi renderizado no
    // DOM: a marcação do h1 só existe se a tradução foi de fato renderizada.
    assert.include(
      response.text(),
      '<h1>Escrevemos a infraestrutura que outros times importam.</h1>'
    )
  })

  test('/en entrega inglês', async ({ client, assert }) => {
    const response = await client.get('/en')
    response.assertStatus(200)
    // Mesmo cuidado: assertar a marcação renderizada, não a frase solta que
    // também aparece no JSON de props.
    assert.include(response.text(), '<h1>The team behind the packages you already run.</h1>')
  })

  test('cada locale aponta hreflang para o outro', async ({ client, assert }) => {
    const response = await client.get('/')
    assert.include(response.text(), 'hreflang="en"')
    assert.include(response.text(), '/en')
  })

  test('Accept-Language em inglês redireciona a raiz para /en', async ({ client }) => {
    const response = await client.get('/').header('Accept-Language', 'en-US,en;q=0.9').redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/en')
  })

  test('a escolha explícita do usuário vence a negociação', async ({ client }) => {
    const response = await client
      .get('/')
      .header('Accept-Language', 'en-US,en;q=0.9')
      .withCookie('locale', 'pt-BR')
      .redirects(0)

    response.assertStatus(200)
  })

  test('o documento anuncia o lang correto por locale', async ({ client, assert }) => {
    const pt = await client.get('/')
    assert.include(pt.text(), 'lang="pt-BR"')

    const en = await client.get('/en')
    assert.include(en.text(), 'lang="en"')
  })

  test('/en grava o cookie de locale', async ({ client }) => {
    const response = await client.get('/en')
    response.assertCookie('locale', 'en')
  })

  test('a raiz com cookie en redireciona para /en em vez de renderizar inglês', async ({
    client,
  }) => {
    const response = await client.get('/').withCookie('locale', 'en').redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/en')
  })

  test('/?lang=pt-BR grava o cookie e redireciona para a raiz sem o query param', async ({
    client,
  }) => {
    const response = await client.get('/?lang=pt-BR').redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/')
    response.assertCookie('locale', 'pt-BR')
  })

  test('a raiz nunca renderiza inglês: um render comum não grava o cookie', async ({
    client,
    assert,
  }) => {
    const response = await client.get('/')

    response.assertStatus(200)
    assert.include(
      response.text(),
      '<h1>Escrevemos a infraestrutura que outros times importam.</h1>'
    )
    response.assertCookieMissing('locale')
  })

  test('um cookie de locale não suportado é ignorado e a negociação roda normal', async ({
    client,
  }) => {
    const response = await client
      .get('/')
      .header('Accept-Language', 'en-US')
      .withCookie('locale', 'fr')
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/en')
  })
})
