import { MANIFEST, PKGS } from '~/data/packages'
import { useMetrics, useNumber, usePackageDownloads, useT } from '~/lib/i18n'

/**
 * A coluna da direita rola os pacotes reais em laço. A lista é duplicada para
 * a emenda não aparecer; `prefers-reduced-motion` para a animação (app.css).
 * Downloads vêm de `packageDownloads` (prop Inertia, do banco): um pacote
 * ainda sem métrica — o job diário só preencheu parte dos 178 — não ganha
 * `.pk-dl` nenhum, em vez de aparecer com um zero inventado.
 */
function PackageColumn() {
  const t = useT()
  const n = useNumber()
  const downloads = usePackageDownloads()
  const rows = PKGS.map(([scope, name]) => {
    const dl = downloads[`${scope}/${name}`]
    return (
      <div className="pk" key={`${scope}/${name}`}>
        <span className="pk-id">
          <span className="pk-scope">{scope}/</span>
          <span className="pk-name">{name}</span>
        </span>
        {dl !== undefined && (
          <span className="pk-dl" data-metric="downloads">
            {n(dl)}
          </span>
        )}
      </div>
    )
  })

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
  const n = useNumber()
  const metrics = useMetrics()

  // O número de downloads da lede é o mesmo do banco que alimenta a faixa do
  // manifesto — nunca um literal na copy. Sem métrica nenhuma a oração inteira
  // some (a lede fecha em "no npm."), mesma regra de degradação do resto da
  // página: um número ausente é honesto, um número velho não é.
  const downloads = metrics ? t('hero.lede.dl', { n: n(metrics.total) }) : ''
  const lede = t('hero.lede', { packages: n(MANIFEST.packages), downloads })

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
            <p className="lede" dangerouslySetInnerHTML={{ __html: lede }} />
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
