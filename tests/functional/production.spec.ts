import { test } from '@japa/runner'
import env from '#start/env'
import { createServer } from 'node:net'
import { execFile, spawn, type ChildProcess } from 'node:child_process'
import { promisify } from 'node:util'
import app from '@adonisjs/core/services/app'

const execFileAsync = promisify(execFile)

const APP_ROOT = app.makePath()
const BUILD_ROOT = app.makePath('build')

/**
 * Um punhado de comportamentos só existe com NODE_ENV=production — o mais
 * caro deles é `renderStatusPages = app.inProduction` (app/exceptions/handler.ts).
 * Em teste as status pages ficam desligadas, então o layout Edge nunca é
 * renderizado com `props = {}`, que é exatamente a forma como um 404 renderiza
 * em produção. Foi assim que `page.props.site.domain` passou por toda a suíte
 * e transformou todo 404 de produção num 500 com a mensagem crua na tela.
 *
 * Este grupo, portanto, não simula produção: builda o projeto e sobe
 * `build/bin/server.js` com NODE_ENV=production num processo separado — a
 * mesma coisa que o CMD do container roda. Custa ~7s e é a única cobertura
 * que enxerga esse caminho.
 */
async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = createServer()
    probe.on('error', reject)
    probe.listen(0, '127.0.0.1', () => {
      const address = probe.address()
      const port = typeof address === 'object' && address ? address.port : 0
      probe.close(() => resolve(port))
    })
  })
}

async function waitForServer(baseUrl: string, child: ChildProcess, stderr: () => string) {
  const deadline = Date.now() + 25_000
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`o servidor de produção morreu ao subir:\n${stderr()}`)
    }
    try {
      await fetch(`${baseUrl}/robots.txt`)
      return
    } catch {
      await new Promise((r) => setTimeout(r, 250))
    }
  }
  throw new Error(`o servidor de produção não subiu a tempo:\n${stderr()}`)
}

test.group('Produção', (group) => {
  let child: ChildProcess
  let baseUrl: string

  group.setup(async () => {
    await execFileAsync('node', ['ace', 'build'], {
      cwd: APP_ROOT,
      env: { ...process.env, NODE_ENV: 'development' },
    })

    const port = await freePort()
    baseUrl = `http://127.0.0.1:${port}`

    child = spawn('node', ['bin/server.js'], {
      cwd: BUILD_ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: String(port),
        HOST: '127.0.0.1',
        APP_URL: baseUrl,
        LOG_LEVEL: 'silent',
        APP_KEY: env.get('APP_KEY').release(),
        SESSION_DRIVER: 'memory',
        DB_HOST: env.get('DB_HOST'),
        DB_PORT: String(env.get('DB_PORT')),
        DB_USER: env.get('DB_USER'),
        DB_PASSWORD: env.get('DB_PASSWORD') ?? '',
        DB_DATABASE: env.get('DB_DATABASE'),
        QUEUE_DRIVER: 'database',
        LIMITER_STORE: 'database',
      },
    })

    let output = ''
    child.stdout?.on('data', (chunk) => (output += chunk))
    child.stderr?.on('data', (chunk) => (output += chunk))

    await waitForServer(baseUrl, child, () => output)

    return () => {
      child.kill('SIGKILL')
    }
  })

  test('uma URL morta responde 404 com a página renderizada, não 500', async ({ assert }) => {
    const response = await fetch(`${baseUrl}/nope`)
    const body = await response.text()

    assert.equal(response.status, 404)
    assert.include(response.headers.get('content-type') ?? '', 'text/html')
    // A página de erro do Inertia, renderizada no servidor — não a mensagem
    // crua de uma exceção que estourou dentro do próprio error handler.
    assert.include(body, 'Page not found')
    assert.notInclude(body, 'Cannot read properties')
    // O layout tem que sair íntegro mesmo sem props: o <html lang> preenchido
    // é o que prova que a expressão não foi só engolida por um erro.
    assert.include(body, '<html lang="pt-BR">')
  }).timeout(30_000)

  test('a landing continua respondendo 200 com NODE_ENV=production', async ({ assert }) => {
    const response = await fetch(`${baseUrl}/`)
    const body = await response.text()

    assert.equal(response.status, 200)
    assert.include(body, 'eloping software')
    // Aqui as props existem, então os alternates de idioma têm que aparecer —
    // o guarda do layout não pode ter apagado o bloco para todo mundo.
    assert.include(body, '<link rel="alternate" hreflang="x-default"')
  }).timeout(30_000)
})
