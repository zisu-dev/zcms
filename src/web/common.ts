import S from 'fluent-schema'
export { S }

export const ObjectIdParamsSchema = S.object().prop(
  'id',
  S.string().minLength(1)
)
