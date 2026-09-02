import BriefingForm from '~/components/briefing_form'
import Hero from '~/components/hero'
import ManifestBar from '~/components/manifest_bar'
import Nav from '~/components/nav'
import OpenSource from '~/components/open_source'
import Process from '~/components/process'
import Services from '~/components/services'
import SiteFooter from '~/components/site_footer'
import Stack from '~/components/stack'
import { useLocale } from '~/lib/i18n'
import { useLandingMotion } from '~/lib/motion'

/**
 * A ordem das seções muda por locale. O português conduz pela metodologia
 * (processo → serviços → open source); o inglês entrega a prova primeiro
 * (open source → serviços → processo), porque quem chega em inglês veio de um
 * README de pacote. O DOM sai já na ordem certa — é o que a leitura por
 * teclado e por buscador enxerga — e o `order` do CSS (app.css) é o que
 * garante o arranjo visual do flex column.
 */
export default function Landing() {
  const locale = useLocale()
  useLandingMotion()

  const process = <Process key="processo" />
  const services = <Services key="servicos" />
  const openSource = <OpenSource key="oss" />

  return (
    <>
      <div className="axis">
        <div className="axis-fill" id="axisFill" />
      </div>

      <Nav />

      <main id="top" className={locale === 'en' ? 'en' : undefined}>
        <Hero />
        <ManifestBar />
        {locale === 'en' ? [openSource, services, process] : [process, services, openSource]}
        <Stack />
        <BriefingForm />
        <SiteFooter />
      </main>
    </>
  )
}
