import { test } from '@japa/runner'
import NpmDownloadsService from '#services/npm_downloads_service'
import NpmMetric from '#models/npm_metric'

test.group('NpmDownloadsService', (group) => {
  group.each.setup(async () => {
    await NpmMetric.truncate()
  })

  // Small safety margin over the suite default (2000ms, from adonisrc.ts).
  // The tests below override backoffMs so retries stay fast; this just
  // guards against CI/DB jitter.
  group.each.timeout(5_000)

  test('agrega downloads por ecossistema', async ({ assert }) => {
    await NpmMetric.createMany([
      { scope: '@dudousxd', packageName: 'nestjs-telescope', downloads: 100 },
      { scope: '@dudousxd', packageName: 'nestjs-durable', downloads: 50 },
      { scope: '@adonis-agora', packageName: 'authkit-server', downloads: 30 },
    ])

    const totals = await NpmDownloadsService.totals()

    assert.deepEqual(totals, { aviary: 150, agora: 30, total: 180 })
  })

  test('devolve null com a tabela vazia, para a página omitir a métrica', async ({ assert }) => {
    assert.isNull(await NpmDownloadsService.totals())
  })

  test('um pacote que falhou mantém o último valor conhecido', async ({ assert }) => {
    await NpmMetric.create({
      scope: '@dudousxd',
      packageName: 'nestjs-telescope',
      downloads: 999,
    })

    // backoffMs overridden (as in the other tests below) so this exercises
    // the retry/keep-last-value *logic* without waiting out the service's
    // real production backoff, which now grows exponentially over up to
    // MAX_ATTEMPTS retries and is deliberately slow (built for npm's 429
    // storms, not for a test's patience).
    const service = new NpmDownloadsService({
      fetch: async (name: string) => {
        if (name === '@dudousxd/nestjs-telescope') throw new Error('429')
        return 10
      },
      backoffMs: 1,
    })

    const result = await service.sync([
      { scope: '@dudousxd', packageName: 'nestjs-telescope' },
      { scope: '@dudousxd', packageName: 'nestjs-durable' },
    ])

    const kept = await NpmMetric.findByOrFail('packageName', 'nestjs-telescope')

    assert.equal(kept.downloads, 999, 'não pode zerar o que falhou')
    assert.deepEqual(result.failed, ['@dudousxd/nestjs-telescope'])
    assert.equal(result.updated, 1)
  })

  test('repete com backoff no 429 antes de desistir', async ({ assert }) => {
    let attempts = 0
    const service = new NpmDownloadsService({
      fetch: async () => {
        attempts++
        if (attempts < 3) throw Object.assign(new Error('429'), { status: 429 })
        return 42
      },
      backoffMs: 1,
    })

    await service.sync([{ scope: '@dudousxd', packageName: 'nestjs-telescope' }])

    assert.equal(attempts, 3)
    const row = await NpmMetric.findByOrFail('packageName', 'nestjs-telescope')
    assert.equal(row.downloads, 42)
  })
})
