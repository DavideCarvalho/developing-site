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

  test('o default de produção de maxAttempts é 6', async ({ assert }) => {
    // Lido da instância construída (o getter), não da constante do módulo —
    // é a instância, não o código-fonte, que a produção de fato usa.
    const service = new NpmDownloadsService()
    assert.equal(service.maxAttempts, 6)
  })

  test('backoff é exponencial e tem teto em 10s', async ({ assert }) => {
    // Injeta `sleep` para capturar os delays que o código pede, em vez de
    // esperá-los de verdade — mas usa o backoffMs *real* de produção (não
    // passado aqui, então cai no default de 800), para que este teste pinne
    // a fórmula de verdade. Se a fórmula voltar a ser linear
    // (backoffMs * attempt em vez de backoffMs * 2**(attempt-1)), a
    // sequência capturada muda e o assert.deepEqual abaixo falha.
    //
    // maxAttempts:7 é só para este teste observar seis esperas (N tentativas
    // produzem N-1 esperas, já que o loop desiste sem dormir na última) e
    // assim provar que o teto se repete, não só dispara uma vez por acaso.
    // O default de produção continua 6 (~22s de pior caso), verificado no
    // teste anterior — não foi alterado para acomodar este teste.
    const delays: number[] = []
    const service = new NpmDownloadsService({
      fetch: async () => {
        throw Object.assign(new Error('429'), { status: 429 })
      },
      sleep: async (ms: number) => {
        delays.push(ms)
      },
      maxAttempts: 7,
    })

    await service.sync([{ scope: '@dudousxd', packageName: 'nestjs-telescope' }])

    assert.deepEqual(delays, [800, 1600, 3200, 6400, 10000, 10000])
  })

  test('404 não repete — não queima tentativas com pacote inexistente', async ({ assert }) => {
    let calls = 0
    const service = new NpmDownloadsService({
      fetch: async () => {
        calls++
        throw Object.assign(new Error('404'), { status: 404 })
      },
    })

    const result = await service.sync([{ scope: '@dudousxd', packageName: 'nestjs-inexistente' }])

    assert.equal(calls, 1, 'um 404 não é retryable — uma tentativa só')
    assert.deepEqual(result.failed, ['@dudousxd/nestjs-inexistente'])
  })

  test('concorrência nunca passa de 6 fetches simultâneos', async ({ assert }) => {
    const packages = Array.from({ length: 24 }, (_, i) => ({
      scope: '@dudousxd',
      packageName: `pkg-${i}`,
    }))

    let inFlight = 0
    let maxInFlight = 0
    const service = new NpmDownloadsService({
      fetch: async () => {
        inFlight++
        maxInFlight = Math.max(maxInFlight, inFlight)
        await new Promise((r) => setTimeout(r, 15))
        inFlight--
        return 1
      },
    })

    await service.sync(packages)

    assert.isAtMost(maxInFlight, 6, 'nunca deve haver mais de 6 fetches em voo ao mesmo tempo')
    assert.equal(
      maxInFlight,
      6,
      'deve de fato usar toda a concorrência disponível (24 pacotes, 6 workers)'
    )
  })

  test('aborta no meio do backoff: para sem tentar de novo e sem escrever', async ({ assert }) => {
    const controller = new AbortController()
    let fetchCalls = 0

    // Usa o `sleep` real (não injetado) — este teste precisa exercitar o
    // cancelamento de verdade, não uma versão mockada dele.
    const service = new NpmDownloadsService({
      fetch: async () => {
        fetchCalls++
        // A 2ª tentativa teria sucesso — só não deve nunca acontecer.
        if (fetchCalls === 1) throw Object.assign(new Error('429'), { status: 429 })
        return 42
      },
      backoffMs: 500,
      signal: controller.signal,
    })

    const syncPromise = service.sync([{ scope: '@dudousxd', packageName: 'nestjs-telescope' }])

    // Dá tempo da 1ª tentativa falhar e entrar na espera de backoff antes
    // de abortar no meio dela.
    await new Promise((r) => setTimeout(r, 20))
    controller.abort()
    await syncPromise

    assert.equal(fetchCalls, 1, 'não deve tentar de novo depois do abort')
    const row = await NpmMetric.findBy('packageName', 'nestjs-telescope')
    assert.isNull(row, 'não deve escrever nada depois do abort')
  })
})
