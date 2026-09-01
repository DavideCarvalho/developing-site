import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import adonisjs from '@adonisjs/vite/client'
import tailwindcss from '@tailwindcss/vite'

/**
 * No Vite 8, o `resources/css/app.css` que o plugin do Adonis registra como
 * entrypoint vaza para o build de SSR e o quebra com erro em `viteMetadata`.
 * O ambiente `ssr` só pode ter uma entrada: o próprio ssr.tsx.
 */
const ssrCssGuard = {
  name: 'developing:ssr-css-guard',
  configEnvironment(name: string, config: any) {
    if (name !== 'ssr') return
    config.build ??= {}
    config.build.rollupOptions ??= {}
    config.build.rollupOptions.input = ['inertia/app/ssr.tsx']
  },
}

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    adonisjs({
      entryPoints: ['inertia/app/app.tsx', 'resources/css/app.css'],
      serverEntryPoints: ['inertia/app/ssr.tsx'],
      reload: ['resources/views/**/*.edge'],
    }),
    ssrCssGuard,
  ],

  resolve: {
    alias: {
      '#config': `${import.meta.dirname}/config`,
      '~': `${import.meta.dirname}/inertia`,
    },
  },

  server: {
    watch: {
      ignored: ['**/storage/**', '**/tmp/**'],
    },
  },
})
