import S, { ObjectSchema } from 'fluent-json-schema'
export { S }

export const UserIdSchema = S.string()
  .minLength(3)
  .maxLength(10)
  .pattern(/^[a-z_][a-z0-9_]+$/)

export const ObjectIdSchema = S.object().prop(
  'id',
  S.string().minLength(24).maxLength(24).required()
)

export const ObjectIdOrSlugSchema = S.object().prop('idOrSlug', S.string())

export const UserDTO = S.object()
  .prop('_id', S.string())
  .prop('slug', S.string())
  .prop('name', S.string())
  .prop('email', S.string())
  .prop(
    'perm',
    S.object().prop('admin', S.boolean()).prop('comment', S.boolean())
  )
  .prop('oauth', S.object().prop('github', S.number()))

export const TagDTO = S.object()
  .prop('_id', S.string())
  .prop('slug', S.string())
  .prop('title', S.string())
  .prop('content', S.string())

export const TagEmbeddedDTO = S.object()
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
  .prop('updated', S.number())
  .prop('public', S.boolean())
  .prop('tags', S.array().items(TagEmbeddedDTO))

export const MetaDTO = S.object()
  .prop('_id', S.string())
  .prop('slug', S.string())
  .prop('value')
  .prop('public', S.boolean())

export function paginationResult(type: ObjectSchema) {
  return S.object()
    .prop('items', S.array().items(type))
    .prop('total', S.integer())
}
