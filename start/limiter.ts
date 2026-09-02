/*
|--------------------------------------------------------------------------
| Define HTTP limiters
|--------------------------------------------------------------------------
|
| The "limiter.define" method creates an HTTP middleware to apply rate
| limits on a route or a group of routes. Feel free to define as many
| throttle middleware as needed.
|
*/

import limiter from '@adonisjs/limiter/services/main'

export const throttle = limiter.define('global', () => {
  return limiter.allowRequests(10).every('1 minute')
})

/**
 * Formulário de briefing: 5 tentativas por hora por IP, depois bloqueia por
 * mais uma hora. Espaça spam sem barrar um visitante legítimo que erra o
 * formulário algumas vezes.
 */
export const briefingThrottle = limiter.define('briefing', () => {
  return limiter.allowRequests(5).every('1 hour').blockFor('1 hour')
})
