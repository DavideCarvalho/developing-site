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
 *
 * Não há item de licença aqui, e a ausência é deliberada. A faixa já foi
 * "100% MIT", depois "MIT" — mas todo item desta tira é um fato agregado sobre
 * o conjunto do trabalho, então um "MIT" solto entre eles continua sendo lido
 * como "e todos eles são MIT". E não são: @dudousxd/nestjs-resilience está
 * publicado sem campo `license`, o que por default é "todos os direitos
 * reservados". Uma tira de números não tem espaço para ressalva, e uma
 * ressalva de licença numa página que se vende por números verificáveis
 * derruba mais a página do que o silêncio. Volta quando o pacote for
 * republicado com `license: "MIT"`.
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
      </div>
    </div>
  )
}
