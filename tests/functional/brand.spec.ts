import { test } from '@japa/runner'

test.group('Marca', () => {
  test('logo e wordmark são servidos como SVG', async ({ client, assert }) => {
    for (const path of ['/brand/logo.svg', '/brand/wordmark.svg', '/favicon.svg']) {
      const response = await client.get(path)
      response.assertStatus(200)
      // superagent trata qualquer content-type "image/*" (inclusive o correto
      // "image/svg+xml") como binário e não popula response.text(), então lemos
      // o corpo bruto em vez de depender do parser de texto do client.
      const body = response.body()
      const text = Buffer.isBuffer(body) ? body.toString('utf-8') : String(body)
      assert.include(text, '<svg')
      assert.notInclude(text, '<image', `${path} contém raster embutido`)
    }
  })
})
