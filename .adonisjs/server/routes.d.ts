import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'seo.sitemap': { paramsTuple?: []; params?: {} }
    'seo.robots': { paramsTuple?: []; params?: {} }
    'landing.pt': { paramsTuple?: []; params?: {} }
    'landing.en': { paramsTuple?: []; params?: {} }
    'briefing.store': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'seo.sitemap': { paramsTuple?: []; params?: {} }
    'seo.robots': { paramsTuple?: []; params?: {} }
    'landing.pt': { paramsTuple?: []; params?: {} }
    'landing.en': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'seo.sitemap': { paramsTuple?: []; params?: {} }
    'seo.robots': { paramsTuple?: []; params?: {} }
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