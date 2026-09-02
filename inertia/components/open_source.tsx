import FamilyChart from '~/components/family_chart'
import { FAMILIES } from '../../database/data/families.js'
import { useMetrics, useNumber, useT } from '~/lib/i18n'

/**
 * Texto e link são estruturais (nome próprio, URL de docs) — não passam por
 * useT, igual aos chips de tecnologia em stack.tsx.
 */
const ECO = {
  aviary: {
    title: 'Aviary',
    scope: '@dudousxd · NestJS',
    docsUrl: 'https://davidecarvalho.github.io/aviary/',
    docsLabel: 'davidecarvalho.github.io/aviary',
    note: 'o.aviary',
  },
  agora: {
    title: 'Agora',
    scope: '@adonis-agora · AdonisJS',
    docsUrl: 'https://davidecarvalho.github.io/agora/',
    docsLabel: 'davidecarvalho.github.io/agora',
    note: 'o.agora',
  },
} as const

const ECOSYSTEMS = ['aviary', 'agora'] as const

/**
 * Contagem de famílias e pacotes por ecossistema, derivada de FAMILIES (dado
 * fixo verificado) — nunca da tabela de métricas.
 */
function familyStats(eco: (typeof ECOSYSTEMS)[number]) {
  const families = FAMILIES.filter((f) => f.eco === eco)
  return {
    families: families.length,
    packages: families.reduce((sum, f) => sum + f.packages, 0),
  }
}

export default function OpenSource() {
  const t = useT()
  const n = useNumber()
  const metrics = useMetrics()

  return (
    <section className="sec blk-oss" id="oss">
      <div className="shell">
        <div className="sec-head rise">
          <p className="eyebrow">{t('o.eyebrow')}</p>
          <h2>{t('o.h2')}</h2>
          <p className="lede">{t('o.lede')}</p>
        </div>

        {ECOSYSTEMS.map((eco) => {
          const meta = ECO[eco]
          const stats = familyStats(eco)
          const downloads = metrics ? metrics[eco] : null

          return (
            <div className={`eco eco-${eco} rise`} key={eco}>
              <div className="eco-head">
                <div className="eco-id">
                  <h3>{meta.title}</h3>
                  <span className="eco-scope">{meta.scope}</span>
                </div>
                <div className="eco-meta">
                  <b>{n(stats.families)}</b> <span>{t('o.fam')}</span>
                  {' · '}
                  <b>{n(stats.packages)}</b> <span>{t('o.pkg')}</span>
                  {downloads !== null && (
                    <>
                      {' · '}
                      <b data-metric="downloads">{n(downloads)}</b> <span>{t('o.dl')}</span>
                    </>
                  )}
                </div>
              </div>
              <p className="eco-note">{t(meta.note)}</p>
              <FamilyChart eco={eco} />
              <div className="eco-foot">
                <a
                  className="eco-link"
                  href={meta.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {meta.docsLabel}
                  {' ↗'}
                </a>
                {eco === 'agora' && <span className="scale-note">{t('o.scale')}</span>}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
