import env from '#start/env'

/**
 * O token do PostHog é público por natureza (vai pro navegador), mas mora em
 * variável de ambiente para que só produção mande eventos.
 */
export const analyticsConfig = {
  posthogKey: env.get('POSTHOG_KEY') ?? null,
  posthogHost: env.get('POSTHOG_HOST') ?? 'https://us.i.posthog.com',
}

export type AnalyticsConfig = typeof analyticsConfig
