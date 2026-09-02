import { test } from '@japa/runner'
import NpmMetric from '#models/npm_metric'

test.group('Open source', (group) => {
  group.each.setup(async () => {
    await NpmMetric.truncate()
  })

  test('as duas escalas do gráfico são compartilhadas', async ({ client, assert }) => {
    const response = await client.get('/')
    const html = response.text()
    // notifications (27) é o maior de todos: tem que ser o único a 100%.
    const widths = [...html.matchAll(/data-bar-width="([\d.]+)"/g)].map((m) => Number(m[1]))
    assert.equal(Math.max(...widths), 100)
    assert.lengthOf(
      widths.filter((w) => w === 100),
      1
    )
    // authkit (9) da Agora tem que ser um terço de notifications, não 100%.
    assert.include(html, 'data-family="agora:authkit" data-bar-width="33.33"')
  })

  test('cada família aponta para seus pacotes no npm', async ({ client, assert }) => {
    const response = await client.get('/')
    const html = response.text()
    assert.include(html, 'npmjs.com/search?q=%40dudousxd%2Fnestjs-telescope')
    assert.include(html, 'npmjs.com/search?q=%40adonis-agora%2Fauthkit')
  })

  test('sem métrica no banco, a página omite downloads em vez de mostrar zero', async ({
    client,
    assert,
  }) => {
    const response = await client.get('/')
    const html = response.text()
    // Asserção estreita de propósito: a palavra "downloads" aparece em
    // outras strings traduzidas, então checa o elemento da métrica.
    assert.notInclude(html, 'data-metric="downloads"')
    assert.include(html, '178')
  })

  test('com métrica no banco, mostra o total por ecossistema', async ({ client, assert }) => {
    await NpmMetric.createMany([
      { scope: '@dudousxd', packageName: 'nestjs-telescope', downloads: 146393 },
      { scope: '@adonis-agora', packageName: 'authkit-server', downloads: 61367 },
    ])

    const response = await client.get('/')
    const html = response.text()
    assert.include(html, '146.393')
    assert.include(html, '61.367')
  })

  test('o manifesto rolante do hero mostra downloads só de pacotes com métrica', async ({
    client,
    assert,
  }) => {
    await NpmMetric.createMany([
      { scope: '@dudousxd', packageName: 'nestjs-telescope', downloads: 146393 },
    ])

    const response = await client.get('/')
    const html = response.text()
    // O elemento renderizado (não a string solta, que também vive nas
    // props do Inertia): a marcação de downloads do pacote com métrica.
    assert.match(html, /<span class="pk-dl" data-metric="downloads">146\.393<\/span>/)
    // Um pacote qualquer sem métrica no banco não ganha o marcador — com só
    // um pacote populado, o marcador só pode vir dele. A coluna do hero
    // duplica a lista de propósito para a emenda da rolagem não aparecer
    // (ver hero.tsx), então a ocorrência esperada é 2, não 1.
    const pkDlCount = (html.match(/class="pk-dl" data-metric="downloads"/g) ?? []).length
    assert.equal(pkDlCount, 2)
  })
})
