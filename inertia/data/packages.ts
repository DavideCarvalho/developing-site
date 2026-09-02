import { FAMILIES } from '../../database/data/families.js'
import { PACKAGES } from '../../database/data/packages.js'

/**
 * A lista de pacotes publicados no npm existe UMA vez, em
 * `database/data/packages.ts` — é ela que o job diário de métricas percorre.
 * Este módulo é só a vista que o cliente consome.
 *
 * Havia duas cópias à mão da mesma lista, e elas já divergiam: a do cliente
 * tinha 177 entradas contra 178 da do servidor, faltando `@adonis-agora/agent`.
 * O manifesto ainda afirmava 178 por literal, então nada apontava a diferença.
 *
 * Downloads continuam fora daqui: vêm do banco via `packageDownloads` (prop
 * Inertia, ver NpmDownloadsService.byPackage()). Zerar um número que não temos
 * seria mentir; a UI omite a métrica em vez disso.
 */
export type Pkg = readonly [scope: string, name: string]

/**
 * `PACKAGES` está em ordem alfabética, que na coluna rolante do hero viraria
 * vinte `nestjs-durable-*` em sequência e depois dezenove `nestjs-telescope-*`.
 * Esta ordenação embaralha por um hash do nome: é uma função pura, então o SSR
 * e a hidratação produzem exatamente a mesma ordem — o que uma ordenação
 * aleatória não daria.
 */
function mixKey(fullName: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < fullName.length; i++) {
    hash ^= fullName.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash
}

export const PKGS: readonly Pkg[] = PACKAGES.map(
  (pkg): [Pkg, string] => [[pkg.scope, pkg.packageName], `${pkg.scope}/${pkg.packageName}`]
)
  .sort(([, a], [, b]) => mixKey(a) - mixKey(b) || a.localeCompare(b))
  .map(([pkg]) => pkg)

/**
 * O manifesto: contagens estruturais DERIVADAS dos dados, nunca afirmadas por
 * literal. Sem downloads aqui — o total por ecossistema vem do banco (prop
 * `metrics`, ver NpmDownloadsService.totals()).
 */
export const MANIFEST: { ecosystems: number; families: number; packages: number } = {
  ecosystems: new Set(FAMILIES.map((family) => family.eco)).size,
  families: FAMILIES.length,
  packages: PKGS.length,
}
