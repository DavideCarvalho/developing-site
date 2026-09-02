import { MANIFEST } from '~/data/packages'
import { useMetrics, useNumber, useT } from '~/lib/i18n'

/**
 * `.shell` direto no flex-column do <main>: sem o `width:100%` de app.css o
 * `margin:0 auto` viraria margem de eixo cruzado e encolheria a faixa até o
 * texto, desalinhando-a do resto da página.
 *
 * O total de downloads vem do banco (`metrics`, ver
 * NpmDownloadsService.totals()). Sem métrica nenhuma ainda, o item some da
 * faixa em vez de mostrar zero.
 */
export default function ManifestBar() {
  const t = useT()
  const n = useNumber()
  const metrics = useMetrics()

  return (
    <div className="shell blk-manifest">
      <div className="manifest">
        <span>
          <b>{n(MANIFEST.ecosystems)}</b> <span>{t('m.eco')}</span>
        </span>
        <span>
          <b>{n(MANIFEST.families)}</b> <span>{t('m.fam')}</span>
        </span>
        <span>
          <b>{n(MANIFEST.packages)}</b> <span>{t('m.pkg')}</span>
        </span>
        {metrics && (
          <span>
            <b data-metric="downloads">{n(metrics.total)}</b> <span>{t('m.dl')}</span>
          </span>
        )}
        <span>
          <b>100%</b> MIT
        </span>
      </div>
    </div>
  )
}
