/**
 * Dados institucionais e endpoints externos num lugar só.
 * Trocar o CNPJ deve ser a edição de uma linha, nunca uma busca por componente.
 */
export const siteConfig = {
  legalName: 'DEVELOPING CONSULTING DESENVOLVEDOR DE SOFTWARE LTDA',
  cnpj: '39.598.365/0001-03',
  email: 'contato@developingconsulting.com.br',
  phone: null as string | null,
  domain: 'https://developingconsulting.com.br',
  docs: {
    aviary: 'https://davidecarvalho.github.io/aviary/',
    agora: 'https://davidecarvalho.github.io/agora/',
  },
} as const

export type SiteConfig = typeof siteConfig
