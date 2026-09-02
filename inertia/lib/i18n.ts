import { usePage } from '@inertiajs/react'

export type Locale = 'pt-BR' | 'en'

/**
 * null quando a tabela `npm_metrics` está vazia: a página omite os
 * downloads em vez de estampar zero. Ver NpmDownloadsService.totals().
 */
export type Metrics = { aviary: number; agora: number; total: number } | null

type LandingSharedProps = {
  locale: Locale
  messages: Record<string, string>
  metrics: Metrics
  /** Downloads por pacote, chave `${scope}/${packageName}`. Pacote ausente
   *  daqui não tem métrica no banco ainda — omite o número, não zera. */
  packageDownloads: Record<string, number>
}

function useLandingProps() {
  return usePage().props as unknown as LandingSharedProps
}

/**
 * O i18n do Adonis prefixa cada chave com o nome do arquivo: site.json vira
 * "site.hero.h1". Os componentes falam a chave curta do mockup e a tradução do
 * namespace é resolvida aqui — trocar o arquivo de copy é mudar esta constante.
 */
const NAMESPACE = 'site'

/**
 * Toda string visível da página sai daqui. A chave volta como fallback: uma
 * tradução faltando aparece como "p.s2h" na tela, o que é ruidoso de propósito.
 *
 * O namespace por trás de `useT()` é sempre "site" — resources/lang/*\/site.json
 * nunca é tocado por outra feature. Strings novas (como as de SEO) entram num
 * arquivo próprio, do mesmo jeito que errors.json e validator.json já fazem, e
 * passam o namespace explicitamente: `useT('seo')`.
 */
export function useT(namespace: string = NAMESPACE) {
  const { messages } = useLandingProps()
  return (key: string) => messages[`${namespace}.${key}`] ?? messages[key] ?? key
}

export function useLocale(): Locale {
  return useLandingProps().locale
}

export function useMetrics(): Metrics {
  return useLandingProps().metrics
}

export function usePackageDownloads(): Record<string, number> {
  return useLandingProps().packageDownloads
}

/**
 * Números com separador do locale. O servidor e o cliente usam o mesmo ICU do
 * Node/navegador, então o SSR e a hidratação batem.
 */
export function useNumber() {
  const locale = useLocale()
  return (n: number) => n.toLocaleString(locale === 'en' ? 'en-US' : 'pt-BR')
}
