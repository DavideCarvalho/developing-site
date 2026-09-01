import type { HttpContext } from '@adonisjs/core/http'
import { siteConfig } from '#config/site'

export default class LandingController {
  async show({ inertia }: HttpContext) {
    return inertia.render('landing', {
      site: siteConfig,
    })
  }
}
