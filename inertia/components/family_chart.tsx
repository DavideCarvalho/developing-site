import { FAMILIES } from '../../database/data/families.js'

const SCOPE = { aviary: '@dudousxd/nestjs-', agora: '@adonis-agora/' } as const

/**
 * Escala compartilhada entre os dois ecossistemas. Se cada um usasse o
 * próprio máximo, o authkit da Agora (9) pareceria do tamanho do
 * notifications da Aviary (27) e o gráfico mentiria. `data-bar-width` carrega
 * o número puro para os testes; `data-w`, com o "%", é o que `useLandingMotion`
 * lê para animar a barra na revelação por scroll.
 */
const MAX = Math.max(...FAMILIES.map((f) => f.packages))

export default function FamilyChart({ eco }: { eco: 'aviary' | 'agora' }) {
  return (
    <div className="chart" data-eco={eco}>
      {FAMILIES.filter((f) => f.eco === eco).map((f) => {
        const width = Number(((f.packages / MAX) * 100).toFixed(2))
        return (
          <a
            key={f.name}
            className="fam"
            href={`https://www.npmjs.com/search?q=${encodeURIComponent(SCOPE[eco] + f.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            data-family={`${eco}:${f.name}`}
            data-bar-width={width}
          >
            <span className="fam-name">{f.name}</span>
            <span className="fam-track">
              <span className="fam-bar" data-w={`${width}%`} />
            </span>
            <span className="fam-val">{f.packages}</span>
          </a>
        )
      })}
    </div>
  )
}
