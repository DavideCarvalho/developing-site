import { configApp } from '@adonisjs/eslint-config'
import { react } from '@adonisjs/eslint-config/react'

export default configApp(
  ...react,
  {
    /**
     * `database/data/families.ts` não é código de backend de verdade — é a
     * mesma contagem estrutural fixa que o gráfico de famílias (frontend) e
     * (potencialmente) qualquer validação de servidor consultariam. Sem
     * segredo nenhum, então entra no allowlist da regra em vez de duplicar o
     * dado nos dois lados.
     */
    name: 'Dados de families.ts compartilhados com o frontend',
    files: ['inertia/**/*.{ts,tsx}'],
    rules: {
      '@adonisjs/no-backend-import-in-frontend': [
        'error',
        { allowed: ['../../database/data/families.js'] },
      ],
    },
  }
)
