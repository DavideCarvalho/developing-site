/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

const LandingController = () => import('#controllers/landing_controller')

router.get('/', [LandingController, 'show']).as('landing')
