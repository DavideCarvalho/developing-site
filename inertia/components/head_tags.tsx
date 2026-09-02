import { Head } from '@inertiajs/react'
import { useLocale, useT } from '~/lib/i18n'
import { useSite } from '~/lib/site'

/**
 * `og:locale` precisa do formato underscore da Open Graph, não do BCP-47 que
 * o resto da app usa para lang/hreflang.
 */
const OG_LOCALE: Record<'pt-BR' | 'en', string> = {
  'pt-BR': 'pt_BR',
  en: 'en_US',
}

const CANONICAL_PATH: Record<'pt-BR' | 'en', string> = {
  'pt-BR': '/',
  en: '/en',
}

/**
 * Title, meta description, Open Graph/Twitter e o JSON-LD de Organization —
 * tudo renderizado no servidor via `<Head>` (SSR do Inertia coleta e o
 * `@inertiaHead()` do layout emite). Copy de SEO mora em seo.json, um
 * namespace próprio: site.json nunca ganha chave de meta tag.
 */
export default function HeadTags() {
  const site = useSite()
  const locale = useLocale()
  const t = useT('seo')

  const title = t('title')
  const description = t('description')
  const url = `${site.domain}${CANONICAL_PATH[locale]}`
  const image = `${site.domain}/og.png`

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.legalName,
    url: site.domain,
    logo: `${site.domain}/brand/logo.svg`,
    taxID: site.cnpj,
    sameAs: [site.docs.aviary, site.docs.agora],
  }

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Developing" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:locale" content={OG_LOCALE[locale]} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      <script type="application/ld+json">{JSON.stringify(orgJsonLd)}</script>
    </Head>
  )
}
