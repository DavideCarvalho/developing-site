import { test } from '@japa/runner'
import NpmMetric from '#models/npm_metric'

/**
 * A lede do hero carrega o maior número da página, no `.hero-num` âmbar acima
 * da dobra. Ele já foi copy: "207 mil vezes por mês" escrito à mão no
 * site.json, que continuou lá depois do banco registrar 211.031. Estes testes
 * pinam as duas metades da regra — interpola do banco quando há métrica, omite
 * a oração inteira quando não há — sempre contra a marcação renderizada, nunca
 * contra a string solta que também viaja no blob de props do Inertia.
 */
test.group('Hero', (group) => {
  group.each.setup(async () => {
    await NpmMetric.truncate()
  })

  test('a lede tira o total de downloads do banco', async ({ client, assert }) => {
    await NpmMetric.createMany([
      { scope: '@dudousxd', packageName: 'nestjs-telescope', downloads: 150_000 },
      { scope: '@adonis-agora', packageName: 'authkit-server', downloads: 61_031 },
    ])

    const response = await client.get('/')
    const html = response.text()

    assert.include(
      html,
      'no npm, baixados <span class="hero-num" data-metric="downloads">211.031 vezes por mês</span>.'
    )
    // Nenhum resquício do literal antigo, em nenhum dos dois locales.
    assert.notInclude(html, '207 mil')
  })

  test('a lede em inglês interpola o mesmo total, no formato do locale', async ({
    client,
    assert,
  }) => {
    await NpmMetric.createMany([
      { scope: '@dudousxd', packageName: 'nestjs-telescope', downloads: 150_000 },
      { scope: '@adonis-agora', packageName: 'authkit-server', downloads: 61_031 },
    ])

    const response = await client.get('/en')
    const html = response.text()

    assert.include(
      html,
      'on npm, pulled <span class="hero-num" data-metric="downloads">211,031 times a month</span>.'
    )
    assert.notInclude(html, '207k')
  })

  test('sem métrica no banco, a lede omite a oração de downloads inteira', async ({
    client,
    assert,
  }) => {
    const response = await client.get('/')
    const html = response.text()

    // A frase fecha no ponto, sem vírgula pendurada e sem número inventado.
    assert.include(html, '<p class="lede">178 pacotes open source no npm. Dois ecossistemas')
    // O `.hero-num` renderizado some. A string ainda existe no blob de props
    // (o dicionário inteiro viaja para o cliente), mas lá as aspas vêm
    // escapadas — este literal só casa com marcação de verdade.
    assert.notInclude(html, '<span class="hero-num"')
  })

  test('a contagem de pacotes da lede vem do manifesto, não da copy', async ({
    client,
    assert,
  }) => {
    const response = await client.get('/en')
    const html = response.text()

    // Mesmo número que a faixa do manifesto estampa logo abaixo do hero.
    assert.include(
      html,
      '<p class="lede">Aviary for NestJS and Agora for AdonisJS — 178 open source packages'
    )
  })
})
