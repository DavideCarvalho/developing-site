import { test } from '@japa/runner'
import { siteConfig } from '#config/site'
import ptSeo from '../../resources/lang/pt-BR/seo.json' with { type: 'json' }
import enSeo from '../../resources/lang/en/seo.json' with { type: 'json' }

/**
 * O plano deste task hardcoda `https://developing.com.br` nas assertions.
 * Esse domínio é um placeholder — o cliente ainda não confirmou "LT" vs
 * "LTDA" nem o domínio final (ver task-8-brief.md, seção de pendências).
 * Toda URL esperada aqui vem de `siteConfig.domain`, então trocar o domínio
 * em config/site.ts é a única edição necessária: os testes continuam
 * corretos com qualquer valor.
 */
const DOMAIN = siteConfig.domain

/** Extrai o conteúdo do primeiro <url>...</url> cujo <loc> é `loc`. */
function urlBlock(xml: string, loc: string): string {
  const escaped = loc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = xml.match(
    new RegExp(`<url>(?:(?!</url>).)*<loc>${escaped}</loc>(?:(?!</url>).)*</url>`, 's')
  )
  if (!match) throw new Error(`nenhum bloco <url> encontrado para ${loc}`)
  return match[0]
}

/**
 * Extrai e faz parse do primeiro bloco JSON-LD da página. O head manager do
 * Inertia acrescenta `data-inertia` a toda tag que ele gerencia (visível no
 * SSR: `<script type="application/ld+json" data-inertia>...`), então o
 * regex não pode assumir que `>` fecha a tag logo depois de `"ld+json"`.
 */
function jsonLd(html: string): Record<string, unknown> {
  const match = html.match(/<script type="application\/ld\+json"[^>]*>([^<]+)<\/script>/)
  if (!match) throw new Error('nenhum bloco <script type="application/ld+json"> encontrado')
  return JSON.parse(match[1])
}

test.group('SEO', () => {
  test('o sitemap lista os dois locales', async ({ client, assert }) => {
    const response = await client.get('/sitemap.xml')
    response.assertStatus(200)
    response.assertHeader('content-type', 'application/xml; charset=utf-8')
    assert.include(response.text(), `<loc>${DOMAIN}/</loc>`)
    assert.include(response.text(), `<loc>${DOMAIN}/en</loc>`)
  })

  test('o sitemap declara hreflang recíproco nos dois blocos de <url>', async ({
    client,
    assert,
  }) => {
    const xml = (await client.get('/sitemap.xml')).text()

    const pt = urlBlock(xml, `${DOMAIN}/`)
    const en = urlBlock(xml, `${DOMAIN}/en`)

    for (const block of [pt, en]) {
      assert.include(block, `hreflang="pt-BR" href="${DOMAIN}/"`)
      assert.include(block, `hreflang="en" href="${DOMAIN}/en"`)
    }
  })

  test('o robots aponta para o sitemap', async ({ client, assert }) => {
    const response = await client.get('/robots.txt')
    response.assertStatus(200)
    assert.include(response.text(), `Sitemap: ${DOMAIN}/sitemap.xml`)
  })

  test('a página traz JSON-LD de Organization com a razão social e o CNPJ exatos', async ({
    client,
    assert,
  }) => {
    const html = (await client.get('/')).text()
    const ld = jsonLd(html)

    assert.equal(ld['@type'], 'Organization')
    assert.equal(ld.name, siteConfig.legalName)
    assert.equal(ld.taxID, siteConfig.cnpj)
    assert.equal(ld.url, DOMAIN)
  })

  test('cada locale declara og:locale próprio', async ({ client, assert }) => {
    assert.include((await client.get('/')).text(), 'property="og:locale" content="pt_BR"')
    assert.include((await client.get('/en')).text(), 'property="og:locale" content="en_US"')
  })

  test('cada locale referencia sua própria URL canônica sob o mesmo domínio', async ({
    client,
    assert,
  }) => {
    // Sem `>` no fim: o head manager do Inertia injeta `data-inertia` antes
    // do fechamento da tag no SSR, então o marcador precisa ser só o par
    // rel+href, não a tag inteira.
    assert.include((await client.get('/')).text(), `<link rel="canonical" href="${DOMAIN}/"`)
    assert.include((await client.get('/en')).text(), `<link rel="canonical" href="${DOMAIN}/en"`)
  })

  test('a og:image aponta para /og.png com dimensões declaradas', async ({ client, assert }) => {
    const html = (await client.get('/')).text()
    assert.include(html, `property="og:image" content="${DOMAIN}/og.png"`)
    assert.include(html, 'property="og:image:width" content="1200"')
    assert.include(html, 'property="og:image:height" content="630"')
  })

  test('o <title> renderizado é exatamente o da copy de SEO', async ({ client, assert }) => {
    // O scaffold vinha com um callback de `title` em app.tsx que anexava
    // " - Developing" — e ssr.tsx não tinha o mesmo callback, então o servidor
    // mandava um título e a aba trocava sozinha depois da hidratação. Os dois
    // entrypoints emitem o título da copy, e ele já carrega a marca.
    const pt = await client.get('/')
    assert.include(pt.text(), `<title data-inertia>${ptSeo.title}</title>`)

    const en = await client.get('/en')
    assert.include(en.text(), `<title data-inertia>${enSeo.title}</title>`)
  })
})
