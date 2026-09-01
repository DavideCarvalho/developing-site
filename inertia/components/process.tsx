import { useT } from '~/lib/i18n'

const STEPS = [
  { key: 's1', mark: 'bar' },
  { key: 's2', mark: 'dot' },
  { key: 's3', mark: 'dia' },
  { key: 's4', mark: '' },
] as const

export default function Process() {
  const t = useT()

  return (
    <section className="sec blk-processo" id="processo">
      <div className="shell">
        <div className="sec-head rise">
          <p className="eyebrow">{t('p.eyebrow')}</p>
          <h2>{t('p.h2')}</h2>
          <p className="lede">{t('p.lede')}</p>
        </div>
        <div className="steps rise">
          {STEPS.map(({ key, mark }) => (
            <div className="step" key={key}>
              <div className="step-k">
                <span className={mark ? `step-mark ${mark}` : 'step-mark'} />
                <span>{t(`p.${key}k`)}</span>
              </div>
              <div>
                <h3>{t(`p.${key}h`)}</h3>
                <p>{t(`p.${key}p`)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
