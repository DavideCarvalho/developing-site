import { useLocale, useT } from '~/lib/i18n'

/**
 * O seletor de idioma são duas rotas, não um toggle: o português vai por
 * `/?lang=pt-BR` porque é o query param que faz o middleware gravar a escolha
 * no cookie. Apontar para `/` puro deixaria a escolha sem memória e um
 * navegador em inglês voltaria a ser devolvido para /en na visita seguinte.
 */
export default function Nav() {
  const t = useT()
  const locale = useLocale()

  return (
    <nav className="nav">
      <div className="nav-in">
        <a className="brand" href="#top">
          <img className="bulb" src="/brand/logo.svg" alt="" width={24} height={34} aria-hidden />
          <img className="wm" src="/brand/wordmark.svg" alt="Developing" width={106} height={16} />
        </a>

        <div className="nav-links">
          <a href="#processo">{t('nav.process')}</a>
          <a href="#servicos">{t('nav.services')}</a>
          <a href="#oss">{t('nav.oss')}</a>
        </div>

        <div className="locale" role="group" aria-label={locale === 'en' ? 'Language' : 'Idioma'}>
          <a
            href="/?lang=pt-BR"
            hrefLang="pt-BR"
            lang="pt-BR"
            aria-current={locale === 'pt-BR' ? 'page' : undefined}
          >
            PT
          </a>
          <a href="/en" hrefLang="en" lang="en" aria-current={locale === 'en' ? 'page' : undefined}>
            EN
          </a>
        </div>

        <a className="btn" href="#briefing">
          {t('nav.cta')}
        </a>
      </div>
    </nav>
  )
}
