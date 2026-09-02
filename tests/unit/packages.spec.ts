import { test } from '@japa/runner'
import { PACKAGES } from '#database/data/packages'
import { FAMILIES } from '#database/data/families'

/**
 * A lista de pacotes já existiu em duas cópias mantidas à mão — e elas
 * divergiram: 177 no cliente contra 178 no servidor, faltando
 * `@adonis-agora/agent`. O manifesto afirmava 178 por literal, então a página
 * anunciava um número que nenhuma das duas listas sustentava.
 *
 * Hoje `inertia/data/packages.ts` é derivado deste arquivo e o manifesto é
 * derivado das duas fontes. Sobrou uma coisa para divergir: os dois arquivos
 * de dado fixo entre si. É o que este grupo guarda. Que o cliente de fato
 * renderiza esta lista é assertado em tests/functional/packages.spec.ts.
 */
test.group('Pacotes', () => {
  test('nenhum pacote aparece duas vezes', ({ assert }) => {
    const names = PACKAGES.map((pkg) => `${pkg.scope}/${pkg.packageName}`)
    assert.lengthOf(new Set(names), names.length)
  })

  test('as famílias somam exatamente os pacotes que existem', ({ assert }) => {
    const fromFamilies = FAMILIES.reduce((sum, family) => sum + family.packages, 0)

    // Um pacote que entra em PACKAGES sem entrar na contagem da família dele
    // faz os dois números da página — o do manifesto e o do card do
    // ecossistema — discordarem em silêncio.
    assert.equal(fromFamilies, PACKAGES.length)
  })

  test('cada família pertence a um dos dois ecossistemas', ({ assert }) => {
    assert.deepEqual([...new Set(FAMILIES.map((family) => family.eco))].sort(), [
      'agora',
      'aviary',
    ])
  })
})
