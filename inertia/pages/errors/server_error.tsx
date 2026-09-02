import { Head } from '@inertiajs/react'

/**
 * Mesma regra da not_found: renderiza sem props nenhuma.
 */
export default function ServerError() {
  return (
    <>
      <Head>
        <title>Erro no servidor · Developing</title>
        <meta name="robots" content="noindex" />
      </Head>
      <h1>Something went wrong</h1>
    </>
  )
}
