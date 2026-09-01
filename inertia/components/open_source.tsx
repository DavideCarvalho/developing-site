import type { PropsWithChildren } from 'react'
import { useT } from '~/lib/i18n'

/**
 * A casca da seção. Os dois ecossistemas e o gráfico de famílias entram como
 * children na Task 6 — aqui só existe o cabeçalho e a âncora #oss, que a nav
 * e o segundo CTA do hero já apontam.
 */
export default function OpenSource({ children }: PropsWithChildren) {
  const t = useT()

  return (
    <section className="sec blk-oss" id="oss">
      <div className="shell">
        <div className="sec-head rise">
          <p className="eyebrow">{t('o.eyebrow')}</p>
          <h2>{t('o.h2')}</h2>
          <p className="lede">{t('o.lede')}</p>
        </div>
        {children}
      </div>
    </section>
  )
}
