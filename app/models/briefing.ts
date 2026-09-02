import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Briefing extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare company: string

  @column()
  declare email: string

  @column()
  declare phone: string | null

  @column({ columnName: 'service_type' })
  declare serviceType: string

  @column({ columnName: 'budget_range' })
  declare budgetRange: string | null

  @column()
  declare message: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
