import vine from '@vinejs/vine'

export const briefingValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(120),
    company: vine.string().trim().minLength(2).maxLength(160),
    email: vine.string().trim().email().maxLength(254),
    phone: vine.string().trim().maxLength(40).optional(),
    service_type: vine.enum(['arquitetura', 'projeto', 'suporte']),
    budget_range: vine.enum(['', 't1', 't2', 't3', 't4']).optional(),
    message: vine.string().trim().minLength(20).maxLength(4000),
  })
)
