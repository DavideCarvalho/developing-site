import { test } from '@japa/runner'

test.group('Analytics', () => {
  test('sem POSTHOG_KEY a página não manda chave nenhuma pro navegador', async ({
    client,
    assert,
  }) => {
    const response = await client.get('/').withInertia()
    response.assertStatus(200)
    assert.isNull(response.inertiaProps.analytics.posthogKey)
  })
})
