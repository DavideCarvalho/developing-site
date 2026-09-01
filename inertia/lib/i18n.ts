import { usePage } from '@inertiajs/react'

export type Locale = 'pt-BR' | 'en'

type LandingSharedProps = {
  locale: Locale
  messages: Record<string, string>
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
 */
export function useT() {
  const { messages } = useLandingProps()
  return (key: string) => messages[`${NAMESPACE}.${key}`] ?? messages[key] ?? key
}

export function useLocale(): Locale {
  return useLandingProps().locale
}

/**
 * Números com separador do locale. O servidor e o cliente usam o mesmo ICU do
 * Node/navegador, então o SSR e a hidratação batem.
 */
export function useNumber() {
  const locale = useLocale()
  return (n: number) => n.toLocaleString(locale === 'en' ? 'en-US' : 'pt-BR')
}
