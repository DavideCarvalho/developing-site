import { createRoot } from 'react-dom/client'
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
    createRoot(el).render(<App {...props} />)
  },
  progress: false,
})
