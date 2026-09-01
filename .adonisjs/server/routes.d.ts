import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'landing.pt': { paramsTuple?: []; params?: {} }
    'landing.en': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'landing.pt': { paramsTuple?: []; params?: {} }
    'landing.en': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'landing.pt': { paramsTuple?: []; params?: {} }
    'landing.en': { paramsTuple?: []; params?: {} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}