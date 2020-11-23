import S from 'fluent-schema'
export { S }

export const UserIdSchema = S.string()
  .minLength(3)
  .maxLength(10)
  .pattern(/^[a-z_][a-z0-9_]+$/)

export const ObjectIdSchema = S.object().prop('id', S.string().minLength(1))

export const ObjectIdOrSlugSchema = S.object().prop(
  'idOrSlug',
  S.string().minLength(1)
)
