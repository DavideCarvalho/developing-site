import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class NpmMetric extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare scope: string

  @column({ columnName: 'package_name' })
  declare packageName: string

  @column()
  declare downloads: number

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare fetchedAt: DateTime
}
