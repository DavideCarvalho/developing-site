import type { HttpContext } from '@adonisjs/core/http'
import { siteConfig } from '#config/site'

/**
 * Sitemap e robots vivem fora do fluxo do Inertia: são texto puro, sem SSR,
 * sem props de página. As duas URLs vêm de `siteConfig.domain` — trocar o
 * domínio de produção é editar `config/site.ts`, nunca este arquivo.
 */
export default class SeoController {
  async sitemap({ response }: HttpContext) {
    const urls = [`${siteConfig.domain}/`, `${siteConfig.domain}/en`]
    const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls
  .map(
    (loc) => `  <url>
    <loc>${loc}</loc>
    <xhtml:link rel="alternate" hreflang="pt-BR" href="${siteConfig.domain}/" />
    <xhtml:link rel="alternate" hreflang="en" href="${siteConfig.domain}/en" />
  </url>`
  )
  .join('\n')}
</urlset>
`

    return response.header('content-type', 'application/xml; charset=utf-8').send(body)
  }

  async robots({ response }: HttpContext) {
    return response
      .header('content-type', 'text/plain; charset=utf-8')
      .send(`User-agent: *\nAllow: /\n\nSitemap: ${siteConfig.domain}/sitemap.xml\n`)
  }
}
