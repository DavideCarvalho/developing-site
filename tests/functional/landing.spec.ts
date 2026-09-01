import { test } from '@japa/runner'

test.group('Landing', () => {
  test('a raiz responde 200 com HTML renderizado no servidor', async ({ client, assert }) => {
    const response = await client.get('/')

    response.assertStatus(200)
    assert.include(response.text(), 'DEVELOPING CONSULTING DESENVOLVEDOR DE SOFTWARE LT')
    // As chaves são spans âmbar separados, então a string não aparece
    // contígua no HTML. Asserta o que de fato é um só nó de texto.
    assert.include(response.text(), 'eloping software')
  })
})
