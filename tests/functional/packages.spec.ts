import { test } from '@japa/runner'
import NpmMetric from '#models/npm_metric'
import { PACKAGES } from '#database/data/packages'
import { FAMILIES } from '#database/data/families'

/**
 * O contrato que o cliente tem que cumprir: a coluna do hero e o manifesto
 * saem da MESMA lista que o job diário percorre. Enquanto havia duas cópias à
 * mão, a do cliente tinha 177 entradas e o manifesto afirmava 178 por literal
 * — ninguém percebia. Estas asserções são contra o HTML renderizado, então
 * não há como voltar a divergir sem elas quebrarem.
 */
test.group('Pacotes na página', (group) => {
  // Estado fixo: o item de downloads da faixa só existe quando há métrica, e
  // outros grupos truncam a tabela. Sem semear aqui, a asserção sobre o último
  // item da faixa dependeria da ordem de execução.
  group.each.setup(async () => {
    await NpmMetric.truncate()
    await NpmMetric.create({
      scope: '@dudousxd',
      packageName: 'nestjs-telescope',
      downloads: 123_456,
    })
  })

  test('a coluna do hero renderiza todos os pacotes da lista do job', async ({
    client,
    assert,
  }) => {
    const response = await client.get('/')
    const html = response.text()

    const rendered = [...html.matchAll(/<span class="pk-name">([^<]+)<\/span>/g)].map((m) => m[1])
    // A lista é duplicada de propósito, para a emenda da rolagem não aparecer.
    assert.lengthOf(rendered, PACKAGES.length * 2)
    assert.deepEqual(
      [...new Set(rendered)].sort(),
      [...new Set(PACKAGES.map((pkg) => pkg.packageName))].sort()
    )
  })

  test('o manifesto estampa as contagens derivadas, não literais', async ({ client, assert }) => {
    const response = await client.get('/')
    const html = response.text()
    const ecosystems = new Set(FAMILIES.map((family) => family.eco)).size

    assert.include(html, `<b>${PACKAGES.length}</b> <span>pacotes publicados</span>`)
    assert.include(html, `<b>${FAMILIES.length}</b> <span>famílias de biblioteca</span>`)
    assert.include(html, `<b>${ecosystems}</b> <span>ecossistemas</span>`)
  })

  test('a página não faz nenhuma afirmação de licença, em nenhum dos dois locales', async ({
    client,
    assert,
  }) => {
    // @dudousxd/nestjs-resilience@0.3.1 está publicado no npm sem campo
    // `license`. Pacote sem campo de licença não é permissivo: é "todos os
    // direitos reservados" por default — o oposto de aberto, e onde uma
    // diligência jurídica trava a adoção do Aviary.
    //
    // A faixa do manifesto já foi "100% MIT" e depois "MIT". Tirar o "100%"
    // mudou a redação sem mudar o que o leitor entende: todo item daquela tira
    // é um fato agregado sobre o conjunto ("2 ecossistemas · 25 famílias · 178
    // pacotes"), então um "MIT" solto no meio continua sendo lido como "e
    // todos eles são MIT". O item saiu inteiro. A página não afirma licença
    // nenhuma enquanto o pacote não for republicado.
    //
    // As frases saíram dos JSONs de copy por completo, então a asserção vale
    // para o documento todo — inclusive para o blob de props do Inertia, que
    // carrega o dicionário inteiro. É isso que faz ela pegar uma reversão que
    // só reponha a copy sem tocar no markup.
    for (const path of ['/', '/en']) {
      const response = await client.get(path)
      const html = response.text()

      // Palavra inteira: um hash de asset ou um token que contenha as três
      // letras no meio de outras não é uma afirmação de licença.
      assert.notMatch(html, /\bMIT\b/)

      // Redundantes de propósito: quando uma frase específica volta, a
      // mensagem de falha diz qual, em vez de só "achou MIT em algum lugar".
      assert.notInclude(html, 'MIT packages')
      assert.notInclude(html, 'licença MIT')
      assert.notInclude(html, 'MIT licence')
      assert.notInclude(html, 'tudo MIT')
      assert.notInclude(html, 'all MIT')
    }
  })

  test('a faixa do manifesto termina nos downloads, sem item de licença', async ({
    client,
    assert,
  }) => {
    const response = await client.get('/')
    const html = response.text()

    const bar = html.match(/<div class="manifest">.*?<\/div>/s)?.[0] ?? ''
    assert.notEqual(bar, '', 'a faixa do manifesto existe')
    // (`100%` solto aparece na largura das barras do gráfico de famílias, por
    // isso a asserção é dentro da faixa, não no documento.)
    assert.notInclude(bar, '100%')
    assert.notInclude(bar, 'MIT')
    // O último item é o de downloads — nada foi acrescentado depois dele.
    assert.match(bar, /<span>downloads por mês<\/span><\/span><\/div>$/)
  })
})
