import ReactDOMServer from 'react-dom/server'
import { createInertiaApp, type ResolvedComponent } from '@inertiajs/react'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'

const appName = import.meta.env.VITE_APP_NAME || 'Developing'

export default function render(page: any) {
  return createInertiaApp({
    page,
    // O mesmo callback de app.tsx. Sem ele o servidor emitia o <title> cru e a
    // aba mudava de nome sozinha logo depois da hidratação.
    title: (title) => (title ? `${title} - ${appName}` : appName),
    render: ReactDOMServer.renderToString,
    resolve: (name) => {
      return resolvePageComponent<ResolvedComponent>(
        `../pages/${name}.tsx`,
        import.meta.glob<ResolvedComponent>('../pages/**/*.tsx', { eager: true })
      )
    },
    setup: ({ App, props }) => <App {...props} />,
  })
}
