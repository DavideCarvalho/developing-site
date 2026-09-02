import { test } from '@japa/runner'
import { siteConfig } from '#config/site'

test.group('Landing', () => {
  test('a raiz responde 200 com HTML renderizado no servidor', async ({ client, assert }) => {
    const response = await client.get('/')

    response.assertStatus(200)
    // As chaves são spans âmbar separados, então a string não aparece
    // contígua no HTML. Asserta o que de fato é um só nó de texto.
    assert.include(response.text(), 'eloping software')
  })

  test('o rodapé revela razão social e CNPJ na própria página', async ({ client, assert }) => {
    const response = await client.get('/')
    const html = response.text()

    // Esta é a única exigência LEGAL da página, e era a menos protegida:
    // procurar as strings no documento inteiro passava mesmo com o rodapé
    // apagado, porque razão social e CNPJ também viajam no blob de props do
    // Inertia e no JSON-LD (taxID). Nenhum dos dois é divulgação ao visitante.
    // A asserção é o bloco renderizado do rodapé, com a marcação exata que o
    // React emite (o `<!-- -->` separa o texto literal da interpolação).
    assert.include(
      html,
      `<div class="foot-legal"><b>${siteConfig.legalName}</b><br/>CNPJ <!-- -->${siteConfig.cnpj}</div>`
    )
  })

  test('o /en revela a mesma identificação legal', async ({ client, assert }) => {
    const response = await client.get('/en')
    const html = response.text()

    assert.include(
      html,
      `<div class="foot-legal"><b>${siteConfig.legalName}</b><br/>CNPJ <!-- -->${siteConfig.cnpj}</div>`
    )
  })
})
