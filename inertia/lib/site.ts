import { usePage } from '@inertiajs/react'
import type { SiteConfig } from '#config/site'

/** Dados institucionais vindos de config/site.ts pelas props da página. */
export function useSite(): SiteConfig {
  return (usePage().props as unknown as { site: SiteConfig }).site
}
