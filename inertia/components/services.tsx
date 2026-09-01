import { useLocale, useT } from '~/lib/i18n'

/**
 * O inglês abre pelo suporte: quem chega de um README de pacote já roda as
 * libs e quer saber quem responde quando quebra. O DOM sai na ordem do locale
 * e o `order` do CSS garante o mesmo arranjo visual.
 */
const CARDS = {
  arch: ['s.arch.l1', 's.arch.l2', 's.arch.l3'],
  proj: ['s.proj.l1', 's.proj.l2'],
  sup: ['s.sup.l1', 's.sup.l2', 's.sup.l3'],
} as const

type CardKey = keyof typeof CARDS

const ORDER: Record<'pt-BR' | 'en', readonly CardKey[]> = {
  'pt-BR': ['arch', 'proj', 'sup'],
  'en': ['sup', 'proj', 'arch'],
}

export default function Services() {
  const t = useT()
  const locale = useLocale()

  return (
    <section className="sec blk-servicos" id="servicos">
      <div className="shell">
        <div className="sec-head rise">
          <p className="eyebrow">{t('s.eyebrow')}</p>
          <h2>{t('s.h2')}</h2>
        </div>
        <div className="svcs rise">
          {ORDER[locale].map((card) => (
            <div className={`svc svc-${card}`} key={card}>
              <span className="svc-tag">{t(`s.${card}.tag`)}</span>
              <h3>{t(`s.${card}.h`)}</h3>
              <p>{t(`s.${card}.p`)}</p>
              <ul>
                {CARDS[card].map((item) => (
                  <li key={item}>{t(item)}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
