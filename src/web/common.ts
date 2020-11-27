import S, { ObjectSchema } from 'fluent-schema'
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

export const UserDTO = S.object()
  .prop('_id', S.string())
  .prop('slug', S.string())
  .prop('name', S.string())
  .prop('email', S.string())
  .prop(
    'perm',
    S.object().prop('admin', S.boolean()).prop('comment', S.boolean())
  )

export const TagDTO = S.object()
  .prop('_id', S.string())
  .prop('slug', S.string())
  .prop('title', S.string())

export const PostDTO = S.object()
  .prop('_id', S.string())
  .prop('slug', S.string())
  .prop('priority', S.string())
  .prop('title', S.string())
  .prop('summary', S.string())
  .prop('content', S.string())
  .prop('published', S.number())
  .prop('public', S.boolean())
  .prop('tags', S.array().items(TagDTO))

export function paginationResult(type: ObjectSchema) {
  return S.object()
    .prop('items', S.array().items(type))
    .prop('total', S.integer())
}
