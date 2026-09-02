import { test } from '@japa/runner'
import { PACKAGES } from '#database/data/packages'
import { FAMILIES } from '#database/data/families'

/**
 * O contrato que o cliente tem que cumprir: a coluna do hero e o manifesto
 * saem da MESMA lista que o job diário percorre. Enquanto havia duas cópias à
 * mão, a do cliente tinha 177 entradas e o manifesto afirmava 178 por literal
 * — ninguém percebia. Estas asserções são contra o HTML renderizado, então
 * não há como voltar a divergir sem elas quebrarem.
 */
test.group('Pacotes na página', () => {
  test('a coluna do hero renderiza todos os pacotes da lista do job', async ({
    client,
    assert,
  }) => {
    const html = (await client.get('/')).text()

    const rendered = [...html.matchAll(/<span class="pk-name">([^<]+)<\/span>/g)].map((m) => m[1])
    // A lista é duplicada de propósito, para a emenda da rolagem não aparecer.
    assert.lengthOf(rendered, PACKAGES.length * 2)
    assert.deepEqual(
      [...new Set(rendered)].sort(),
      [...new Set(PACKAGES.map((pkg) => pkg.packageName))].sort()
    )
  })

  test('o manifesto estampa as contagens derivadas, não literais', async ({ client, assert }) => {
    const html = (await client.get('/')).text()
    const ecosystems = new Set(FAMILIES.map((family) => family.eco)).size

    assert.include(html, `<b>${PACKAGES.length}</b> <span>pacotes publicados</span>`)
    assert.include(html, `<b>${FAMILIES.length}</b> <span>famílias de biblioteca</span>`)
    assert.include(html, `<b>${ecosystems}</b> <span>ecossistemas</span>`)
  })
})
