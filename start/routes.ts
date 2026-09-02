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
import { briefingThrottle } from '#start/limiter'

const LandingController = () => import('#controllers/landing_controller')
const BriefingsController = () => import('#controllers/briefings_controller')

router.get('/', [LandingController, 'show']).use(middleware.locale()).as('landing.pt')
router
  .get('/en', [LandingController, 'show'])
  .use(middleware.locale({ locale: 'en' }))
  .as('landing.en')

router.post('/briefing', [BriefingsController, 'store']).use(briefingThrottle).as('briefing.store')
