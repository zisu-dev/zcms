import S from 'fluent-schema'
export { S }

export const UserIdSchema = S.string()
  .minLength(3)
  .maxLength(10)
  .pattern(/^[a-z_][a-z0-9_]+$/)
export const UserIdParamsSchema = S.object().prop('id', UserIdSchema)

export const ObjectIdParamsSchema = S.object().prop(
  'id',
  S.string().minLength(1)
)
