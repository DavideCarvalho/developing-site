import { useT } from '~/lib/i18n'
import { useSite } from '~/lib/site'

/**
 * Como o manifesto, é `.shell` direto no flex-column do <main>: o
 * `width:100%` de app.css é o que impede o bloco de encolher até o texto.
 */
export default function SiteFooter() {
  const t = useT()
  const site = useSite()

  return (
    <div className="shell blk-foot">
      <footer className="foot">
        <div>
          <img src="/brand/wordmark.svg" alt="Developing" width={99} height={15} />
          <div className="foot-legal">
            <b>{site.legalName}</b>
            <br />
            CNPJ {site.cnpj}
          </div>
        </div>
        <div className="foot-legal" style={{ textAlign: 'right' }}>
          <a href={site.docs.aviary} target="_blank" rel="noopener noreferrer">
            Aviary
          </a>{' '}
          ·{' '}
          <a href={site.docs.agora} target="_blank" rel="noopener noreferrer">
            Agora
          </a>
          <br />
          <span>{t('f.oss')}</span>
        </div>
      </footer>
    </div>
  )
}
