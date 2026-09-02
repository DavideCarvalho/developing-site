import { Head } from '@inertiajs/react'

/**
 * Renderizada pelas status pages do handler (só em produção, ver
 * app/exceptions/handler.ts) e portanto SEM props: `inertia.render('errors/…', {})`.
 * Nada aqui pode ler `usePage().props` — nem locale, nem site, nem messages.
 */
export default function NotFound() {
  return (
    <>
      <Head>
        <title>Página não encontrada · Developing</title>
        <meta name="robots" content="noindex" />
      </Head>
      <h1>Page not found</h1>
    </>
  )
}
