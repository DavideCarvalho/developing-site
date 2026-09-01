import { defineConfig } from '@adonisjs/inertia'

export default defineConfig({
  rootView: 'inertia_layout',
  encryptHistory: true,
  ssr: {
    enabled: true,
    entrypoint: 'inertia/app/ssr.tsx',
  },
})
