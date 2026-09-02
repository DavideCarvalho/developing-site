import type { HttpContext } from '@adonisjs/core/http'
import i18nManager from '@adonisjs/i18n/services/main'
import { siteConfig } from '#config/site'
import NpmDownloadsService from '#services/npm_downloads_service'

export default class LandingController {
  async show({ inertia, locale }: HttpContext) {
    return inertia.render('landing', {
      site: siteConfig,
      locale,
      messages: i18nManager.getTranslationsFor(locale),
      metrics: await NpmDownloadsService.totals(),
      packageDownloads: await NpmDownloadsService.byPackage(),
      alternate: [
        { locale: 'pt-BR', href: `${siteConfig.domain}/` },
        { locale: 'en', href: `${siteConfig.domain}/en` },
      ],
    })
  }
}
