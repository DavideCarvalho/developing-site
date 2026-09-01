import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'npm_metrics'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('scope').notNullable()
      table.string('package_name').notNullable()
      table.integer('downloads').unsigned().notNullable()
      table.timestamp('fetched_at', { useTz: true }).notNullable()
      table.unique(['scope', 'package_name'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
