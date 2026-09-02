import { hydrateRoot } from 'react-dom/client'
import { createInertiaApp, type ResolvedComponent } from '@inertiajs/react'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'

const appName = import.meta.env.VITE_APP_NAME || 'Developing'

createInertiaApp({
  title: (title) => (title ? `${title} - ${appName}` : appName),
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
