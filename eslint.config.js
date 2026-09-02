import { configApp } from '@adonisjs/eslint-config'
import { react } from '@adonisjs/eslint-config/react'

export default configApp(...react, {
  /**
   * `database/data/families.ts` e `database/data/packages.ts` não são código
   * de backend de verdade — são a mesma lista/contagem estrutural fixa que o
   * frontend (gráfico de famílias, coluna do hero, manifesto) e o job de
   * métricas consultam. Sem segredo nenhum, e a alternativa é justamente o
   * que já deu errado: duas cópias à mão da mesma lista, divergindo em
   * silêncio (177 contra 178). Entram no allowlist da regra.
   */
  name: 'Dados fixos compartilhados com o frontend',
  files: ['inertia/**/*.{ts,tsx}'],
  rules: {
    '@adonisjs/no-backend-import-in-frontend': [
      'error',
      { allowed: ['../../database/data/families.js', '../../database/data/packages.js'] },
    ],
  },
})
