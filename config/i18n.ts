import app from '@adonisjs/core/services/app'
import { defineConfig, formatters, loaders } from '@adonisjs/i18n'

export default defineConfig({
  defaultLocale: 'pt-BR',
  supportedLocales: ['pt-BR', 'en'],
  formatter: formatters.icu(),
  loaders: [loaders.fs({ location: app.languageFilesPath() })],
})
