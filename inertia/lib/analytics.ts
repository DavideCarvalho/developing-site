import type { AnalyticsConfig } from '#config/analytics'

type PostHog = typeof import('posthog-js').default

let client: PostHog | null = null

/**
 * Carrega o PostHog só no navegador e só com chave configurada. O import é
 * dinâmico para o SDK não entrar no bundle do SSR nem atrasar a hidratação.
 *
 * `persistence: 'memory'`: nenhum cookie nem localStorage, então a
 * landing dispensa banner de consentimento (LGPD). O custo é cada visita
 * contar como um visitante novo.
 */
export async function startAnalytics(config: AnalyticsConfig | undefined) {
  if (client || typeof window === 'undefined' || !config?.posthogKey) return

  const { default: posthog } = await import('posthog-js')
  posthog.init(config.posthogKey, {
    api_host: config.posthogHost,
    defaults: '2025-05-24',
    persistence: 'memory',
    person_profiles: 'identified_only',
  })
  client = posthog
}

/** Evento de produto. Nunca recebe dado pessoal do formulário. */
export function track(event: string, properties?: Record<string, unknown>) {
  client?.capture(event, properties)
}
