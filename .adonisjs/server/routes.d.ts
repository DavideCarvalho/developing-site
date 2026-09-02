import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'landing.pt': { paramsTuple?: []; params?: {} }
    'landing.en': { paramsTuple?: []; params?: {} }
    'briefing.store': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'landing.pt': { paramsTuple?: []; params?: {} }
    'landing.en': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'landing.pt': { paramsTuple?: []; params?: {} }
    'landing.en': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'briefing.store': { paramsTuple?: []; params?: {} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}