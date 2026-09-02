/**
 * Contagens de famílias por ecossistema, conferidas em 2026-09-01. Somam 147
 * pacotes (Aviary, 13 famílias) e 31 pacotes (Agora, 12 famílias) — dados
 * fixos, não recalculados a partir da tabela de métricas.
 */
export const FAMILIES = [
  { eco: 'aviary', name: 'notifications', packages: 27 },
  { eco: 'aviary', name: 'durable', packages: 20 },
  { eco: 'aviary', name: 'telescope', packages: 19 },
  { eco: 'aviary', name: 'media', packages: 16 },
  { eco: 'aviary', name: 'agent', packages: 15 },
  { eco: 'aviary', name: 'catalog', packages: 11 },
  { eco: 'aviary', name: 'authz', packages: 9 },
  { eco: 'aviary', name: 'resilience', packages: 7 },
  { eco: 'aviary', name: 'codegen', packages: 6 },
  { eco: 'aviary', name: 'filter', packages: 6 },
  { eco: 'aviary', name: 'inertia', packages: 6 },
  { eco: 'aviary', name: 'diagnostics', packages: 3 },
  { eco: 'aviary', name: 'context', packages: 2 },
  { eco: 'agora', name: 'authkit', packages: 9 },
  { eco: 'agora', name: 'durable', packages: 3 },
  { eco: 'agora', name: 'media', packages: 3 },
  { eco: 'agora', name: 'payments', packages: 3 },
  { eco: 'agora', name: 'agent', packages: 2 },
  { eco: 'agora', name: 'authz', packages: 2 },
  { eco: 'agora', name: 'collaboration', packages: 2 },
  { eco: 'agora', name: 'filter', packages: 2 },
  { eco: 'agora', name: 'telescope', packages: 2 },
  { eco: 'agora', name: 'context', packages: 1 },
  { eco: 'agora', name: 'diagnostics', packages: 1 },
  { eco: 'agora', name: 'resilience', packages: 1 },
] as const

export type Family = (typeof FAMILIES)[number]
