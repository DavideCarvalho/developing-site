#!/usr/bin/env node
/**
 * Regenera public/og.png a partir dos dados atuais — não de uma string
 * congelada num script. A linha de manifesto vem de resources/lang/pt-BR/site.json
 * (hero.h1) e o wordmark vem de public/brand/wordmark.svg: mudou a copy ou a
 * marca, `node scripts/generate-og-image.mjs` já reflete o estado atual, sem
 * ninguém precisar reconstruir manualmente como a imagem foi feita.
 *
 * Sem dependência nova no projeto: renderiza um HTML temporário com um Chrome
 * headless já instalado na máquina (o mesmo usado para o build normal do
 * Vite/testes em CI com Playwright/Chromium, ou o Chrome de desenvolvimento).
 * Aponte CHROME_PATH se o binário não estiver num dos caminhos padrão abaixo.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, copyFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))

const WIDTH = 1200
const HEIGHT = 630

function findChrome() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH
  const candidates = [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ]
  const found = candidates.find((path) => existsSync(path))
  if (!found) {
    throw new Error(
      'Nenhum Chrome/Chromium encontrado nos caminhos padrão. Defina CHROME_PATH apontando ' +
        'para o binário (ex.: CHROME_PATH=/path/to/chrome node scripts/generate-og-image.mjs).'
    )
  }
  return found
}

function loadManifestoLine() {
  const siteJson = JSON.parse(readFileSync(join(ROOT, 'resources/lang/pt-BR/site.json'), 'utf-8'))
  const line = siteJson['hero.h1']
  if (!line) throw new Error('resources/lang/pt-BR/site.json não tem mais a chave "hero.h1"')
  return line
}

function loadWordmark() {
  return readFileSync(join(ROOT, 'public/brand/wordmark.svg'), 'utf-8')
}

function buildHtml({ wordmark, manifestoLine }) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body { width:${WIDTH}px; height:${HEIGHT}px; background:#080808; overflow:hidden; }
  body {
    display:flex;
    flex-direction:column;
    justify-content:center;
    padding: 0 90px;
    font-family: 'IBM Plex Mono', ui-monospace, Menlo, monospace;
  }
  .wm { width: 420px; height:auto; color:#ffffff; display:block; margin-bottom:56px; }
  .wm svg { display:block; width:100%; height:auto; }
  .line {
    font-family: 'IBM Plex Mono', ui-monospace, Menlo, monospace;
    font-size: 30px;
    line-height: 1.5;
    color: #a8a49c;
    max-width: 880px;
  }
  .sig {
    position:absolute;
    top: 64px;
    left: 90px;
    font-family: 'IBM Plex Mono', ui-monospace, Menlo, monospace;
    font-size: 20px;
    color: #6b6862;
    letter-spacing: 0.02em;
  }
  .sig b { color:#E8AB30; }
</style>
</head>
<body>
  <div class="sig"><b>{</b>dev<b>}</b>eloping software</div>
  <div class="wm">${wordmark}</div>
  <div class="line">${manifestoLine}</div>
</body>
</html>
`
}

function main() {
  const chrome = findChrome()
  const manifestoLine = loadManifestoLine()
  const wordmark = loadWordmark()
  const html = buildHtml({ wordmark, manifestoLine })

  const dir = mkdtempSync(join(tmpdir(), 'developing-og-'))
  const htmlPath = join(dir, 'og.html')
  const pngPath = join(dir, 'og.png')
  writeFileSync(htmlPath, html, 'utf-8')

  execFileSync(
    chrome,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      `--window-size=${WIDTH},${HEIGHT}`,
      `--screenshot=${pngPath}`,
      `file://${htmlPath}`,
    ],
    { stdio: ['ignore', 'ignore', 'ignore'] }
  )

  const outPath = join(ROOT, 'public/og.png')
  copyFileSync(pngPath, outPath)
  rmSync(dir, { recursive: true, force: true })

  console.log(`public/og.png regenerado a partir de resources/lang/pt-BR/site.json (hero.h1) e public/brand/wordmark.svg.`)
}

main()
