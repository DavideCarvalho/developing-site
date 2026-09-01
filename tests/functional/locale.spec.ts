import { test } from '@japa/runner'

test.group('Locale', () => {
  test('a raiz entrega português', async ({ client, assert }) => {
    const response = await client.get('/')
    response.assertStatus(200)
    assert.include(response.text(), 'Escrevemos a infraestrutura que outros times importam.')
  })

  test('/en entrega inglês', async ({ client, assert }) => {
    const response = await client.get('/en')
    response.assertStatus(200)
    assert.include(response.text(), 'The team behind the packages you already run.')
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
})
