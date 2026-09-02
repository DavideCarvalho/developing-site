import { useT } from '~/lib/i18n'

/**
 * Nomes próprios de tecnologia não se traduzem, então os chips são literais —
 * o eyebrow "Stack" também é literal no mockup aprovado.
 */
const CHIPS = [
  'TypeScript',
  'NestJS',
  'AdonisJS',
  'React',
  'Inertia.js',
  'PostgreSQL',
  'Redis',
  'MikroORM · Prisma · Drizzle · TypeORM',
  'OpenTelemetry',
  'Docker',
]

export default function Stack() {
  const t = useT()

  return (
    <section className="sec blk-stack" id="stack">
      <div className="shell">
        <div className="sec-head rise">
          <p className="eyebrow">Stack</p>
          <h2>{t('st.h2')}</h2>
          <p className="lede">{t('st.lede')}</p>
        </div>
        <div className="stack rise">
          {CHIPS.map((chip) => (
            <span className="chip" key={chip}>
              {chip}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
