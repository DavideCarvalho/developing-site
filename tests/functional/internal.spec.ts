import { test } from '@japa/runner'
import env from '#start/env'

/**
 * O caminho de sucesso (202) não é exercitado aqui de propósito: o handler
 * dispara o sync sem await, então um teste que passasse o token correto
 * começaria a bater na API real do npm durante a suíte.
 *
 * O que estes testes guardam é a fronteira de segurança — a rota vive no
 * mesmo app que serve o site, então também responde pelo endereço público, e
 * sem o segredo qualquer um poderia disparar syncs até o npm nos limitar.
 */
test.group('Gatilho interno de sync', () => {
  test('sem token, a rota não existe', async ({ client }) => {
    const response = await client.post('/internal/npm-sync')
    response.assertStatus(404)
  })

  test('com token errado, a rota não existe', async ({ client }) => {
    const response = await client.post('/internal/npm-sync').header('x-sync-token', 'errado')
    response.assertStatus(404)
  })

  test('um token de tamanho diferente do real também é rejeitado', async ({ client }) => {
    // A comparação usa hash de tamanho fixo justamente para que o
    // comprimento do token não vaze pela diferença de tratamento.
    const response = await client
      .post('/internal/npm-sync')
      .header('x-sync-token', 'x'.repeat(env.get('NPM_SYNC_TOKEN').length + 40))
    response.assertStatus(404)
  })
})
