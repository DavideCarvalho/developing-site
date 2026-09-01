import type { SiteConfig } from '#config/site'

export default function Landing({ site }: { site: SiteConfig }) {
  return (
    <main>
      <p className="font-display font-extrabold">
        <span className="text-amber">{'{'}</span>dev
        <span className="text-amber">{'}'}</span>eloping software
      </p>
      <footer className="font-mono text-paper-3">
        {site.legalName}
        <br />
        CNPJ {site.cnpj}
      </footer>
    </main>
  )
}
