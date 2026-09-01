import { DOWNLOADS, MANIFEST } from '~/data/packages'
import { useNumber, useT } from '~/lib/i18n'

/**
 * `.shell` direto no flex-column do <main>: sem o `width:100%` de app.css o
 * `margin:0 auto` viraria margem de eixo cruzado e encolheria a faixa até o
 * texto, desalinhando-a do resto da página.
 */
export default function ManifestBar() {
  const t = useT()
  const n = useNumber()

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
        <span>
          <b>{n(DOWNLOADS.total)}</b> <span>{t('m.dl')}</span>
        </span>
        <span>
          <b>100%</b> MIT
        </span>
      </div>
    </div>
  )
}
