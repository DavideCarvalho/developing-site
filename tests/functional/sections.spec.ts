import { test } from '@japa/runner'

test.group('Seções', () => {
  test('o português mostra open source depois dos serviços', async ({ client, assert }) => {
    const response = await client.get('/')
    const html = response.text()
    assert.isAbove(html.indexOf('id="oss"'), -1, 'a seção de open source existe')
    assert.isBelow(
      html.indexOf('id="servicos"'),
      html.indexOf('id="oss"'),
      'em pt-BR, serviços vem antes de open source'
    )
  })

  test('o inglês mostra open source antes dos serviços', async ({ client, assert }) => {
    const response = await client.get('/en')
    const html = response.text()
    assert.isAbove(html.indexOf('id="oss"'), -1, 'a seção de open source existe')
    assert.isBelow(
      html.indexOf('id="oss"'),
      html.indexOf('id="servicos"'),
      'em en, open source vem antes de serviços'
    )
  })

  test('o dispositivo das chaves aparece uma vez só', async ({ client, assert }) => {
    const response = await client.get('/')
    const html = response.text()
    const matches = html.match(/eloping software/g) ?? []
    assert.lengthOf(matches, 1)
  })

  test('as quatro etapas do processo estão presentes', async ({ client, assert }) => {
    const response = await client.get('/')
    const html = response.text()
    // Assertar só a string pegaria o blob de props do Inertia, onde a copy
    // inteira viaja: o que importa é a etapa renderizada como título.
    for (const step of ['Diagnóstico', 'Especificação', 'Construção', 'Operação']) {
      assert.include(html, `<h3>${step}</h3>`)
    }
  })

  test('a copy é renderizada, não só embarcada nas props', async ({ client, assert }) => {
    const pt = await client.get('/')
    assert.match(pt.text(), /<h1>Escrevemos a infraestrutura que outros times importam\.<\/h1>/)

    const en = await client.get('/en')
    assert.match(en.text(), /<h1>The team behind the packages you already run\.<\/h1>/)
  })

  test('o seletor de idioma leva o português pelo ?lang=pt-BR', async ({ client, assert }) => {
    const response = await client.get('/en')
    const html = response.text()
    // Sem o query param a escolha não vira cookie e um navegador em inglês
    // seria devolvido para /en no próximo clique.
    assert.include(html, 'href="/?lang=pt-BR"')
    assert.include(html, 'href="/en"')
  })

  test('o locale ativo é marcado com aria-current', async ({ client, assert }) => {
    const ptResponse = await client.get('/')
    const pt = ptResponse.text()
    assert.match(pt, /href="\/\?lang=pt-BR"[^>]*aria-current/)

    const enResponse = await client.get('/en')
    const en = enResponse.text()
    assert.match(en, /href="\/en"[^>]*aria-current/)
  })

  test('a marca vem dos vetores, nunca de base64', async ({ client, assert }) => {
    const response = await client.get('/')
    const html = response.text()
    assert.include(html, '/brand/logo.svg')
    assert.include(html, '/brand/wordmark.svg')
    assert.notInclude(html, 'data:image/png;base64')
  })

  test('a ordem dos serviços muda por locale', async ({ client, assert }) => {
    const ptResponse = await client.get('/')
    const pt = ptResponse.text()
    assert.isBelow(pt.indexOf('svc svc-arch'), pt.indexOf('svc svc-sup'))

    const enResponse = await client.get('/en')
    const en = enResponse.text()
    assert.isBelow(en.indexOf('svc svc-sup'), en.indexOf('svc svc-arch'))
  })
})
