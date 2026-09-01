import { PKGS } from '~/data/packages'
import { useNumber, useT } from '~/lib/i18n'

/**
 * A coluna da direita rola os pacotes reais em laço. A lista é duplicada para
 * a emenda não aparecer; `prefers-reduced-motion` para a animação (app.css).
 */
function PackageColumn() {
  const t = useT()
  const n = useNumber()
  const rows = PKGS.map(([scope, name, downloads]) => (
    <div className="pk" key={`${scope}/${name}`}>
      <span className="pk-id">
        <span className="pk-scope">{scope}/</span>
        <span className="pk-name">{name}</span>
      </span>
      <span className="pk-dl">{n(downloads)}</span>
    </div>
  ))

  return (
    <div aria-hidden="true">
      <p className="pkghead">
        <span>@dudousxd · @adonis-agora</span>
        <span>{t('hero.dl')}</span>
      </p>
      <div className="pkgcol">
        <div className="pkgscroll">
          {rows}
          {rows}
        </div>
      </div>
    </div>
  )
}

export default function Hero() {
  const t = useT()

  return (
    <section className="sec blk-hero" style={{ paddingTop: 0 }}>
      <div className="shell">
        <div className="hero">
          <div>
            {/* O dispositivo das chaves aparece uma vez na página, e não se traduz. */}
            <p className="sig">
              <b>{'{'}</b>dev<b>{'}'}</b>eloping software
            </p>
            <h1>{t('hero.h1')}</h1>
            {/* A lede carrega um <span class="hero-num"> âmbar na copy aprovada. */}
            <p className="lede" dangerouslySetInnerHTML={{ __html: t('hero.lede') }} />
            <div className="hero-cta">
              <a className="btn" href="#briefing">
                {t('hero.cta1')}
              </a>
              <a className="btn btn-ghost" href="#oss">
                {t('hero.cta2')}
              </a>
            </div>
          </div>
          <PackageColumn />
        </div>
      </div>
    </section>
  )
}
