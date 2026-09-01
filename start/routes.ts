/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const LandingController = () => import('#controllers/landing_controller')

router.get('/', [LandingController, 'show']).use(middleware.locale()).as('landing.pt')
router
  .get('/en', [LandingController, 'show'])
  .use(middleware.locale({ locale: 'en' }))
  .as('landing.en')
