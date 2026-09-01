import type { SiteConfig } from '#config/site'

type Locale = 'pt-BR' | 'en'

type Alternate = {
  locale: string
  href: string
}

type LandingProps = {
  site: SiteConfig
  locale: Locale
  messages: Record<string, string>
  alternate: Alternate[]
}

export default function Landing({ site, messages }: LandingProps) {
  return (
    <main>
      <p className="font-display font-extrabold">
        <span className="text-amber">{'{'}</span>dev
        <span className="text-amber">{'}'}</span>eloping software
      </p>
      <h1>{messages['hero.h1']}</h1>
      <footer className="font-mono text-paper-3">
        {site.legalName}
        <br />
        CNPJ {site.cnpj}
      </footer>
    </main>
  )
}
