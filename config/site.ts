/**
 * Dados institucionais e endpoints externos num lugar só.
 * Trocar o CNPJ deve ser a edição de uma linha, nunca uma busca por componente.
 */
export const siteConfig = {
  legalName: 'DEVELOPING CONSULTING DESENVOLVEDOR DE SOFTWARE LT',
  cnpj: '39.598.365/0001-03',
  email: 'contato@developing.com.br',
  phone: null as string | null,
  domain: 'https://developing.com.br',
  docs: {
    aviary: 'https://davidecarvalho.github.io/aviary/',
    agora: 'https://davidecarvalho.github.io/agora/',
  },
} as const

export type SiteConfig = typeof siteConfig
