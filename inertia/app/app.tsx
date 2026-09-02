import { hydrateRoot } from 'react-dom/client'
import { createInertiaApp, type ResolvedComponent } from '@inertiajs/react'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'

/**
 * Sem callback de `title`: o <title> da página é escrito à mão em
 * resources/lang/*\/seo.json e já carrega a marca ("Developing — …"). O
 * default do scaffold anexava " - Developing" a ele, duplicando o nome — e
 * como ssr.tsx não tinha o mesmo callback, o servidor mandava um título e a
 * aba trocava para outro depois da hidratação. Os dois entrypoints agora
 * emitem exatamente o que a copy de SEO diz.
 */
createInertiaApp({
  resolve: (name) => {
    return resolvePageComponent<ResolvedComponent>(
      `../pages/${name}.tsx`,
      import.meta.glob<ResolvedComponent>('../pages/**/*.tsx')
    )
  },
  setup({ el, App, props }) {
    // hydrateRoot, não createRoot: o SSR está ligado (config/inertia.ts) e o
    // markup já vem pronto do servidor. createRoot jogava tudo fora e montava
    // de novo — piscada visível e as animações de entrada (.rise) redisparando
    // depois que a página já tinha assentado.
    hydrateRoot(el, <App {...props} />)
  },
  progress: false,
})
