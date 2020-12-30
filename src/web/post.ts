import { FastifyPluginAsync } from 'fastify'
import { Db, FilterQuery, ObjectId, UpdateQuery } from 'mongodb'
import { getCollections, IPostDoc } from '../db'
import { DI, isObjectId, K_DB } from '../utils'
import {
  ObjectIdOrSlugSchema,
  ObjectIdSchema,
  paginationResult,
  PostDTO,
  S
} from './common'

export const postPlugin: FastifyPluginAsync = async (V) => {
  const db = await DI.waitFor<Db>(K_DB)
  const { Posts, Tags } = getCollections(db)

  V.get(
    '/',
    {
      schema: {
        querystring: S.object()
          .prop('page', S.integer().minimum(1).required())
          .prop('per_page', S.integer().minimum(1).maximum(50).required())
          .prop('search', S.string().minLength(1).maxLength(128))
          .prop('tag', S.string().minLength(1))
          .prop('sort', S.string().enum(['updated']))
          .prop('published_before', S.integer())
          .prop('published_after', S.integer()),
        response: {
          200: paginationResult(PostDTO)
        }
      }
    },
    async (req) => {
      const { query: qs } = <any>req
      const { page, per_page } = qs
      const now = new Date()

      const query: FilterQuery<IPostDoc> = {
        priority: {
          $gte: 0
        },
        published: {
          $lte: now
        }
      }
      if (!req.ctx.user?.perm.admin) {
        query.public = true
      }
      if ('search' in qs) query.content = new RegExp(qs.search)
      if ('tag' in qs) query['tags._id'] = new ObjectId(qs.tag)
      if ('published_before' in qs) {
        if (!req.ctx.user?.perm.admin) {
          qs.published_before = Math.min(qs.published_before, +now)
        }
        // @ts-expect-error
        query.published.$lte = new Date(qs.published_before)
      }
      if ('published_after' in qs) {
        // @ts-expect-error
        query.published.$gte = new Date(qs.published_after)
      }

      const total = await Posts.countDocuments(query)
      const skip = (page - 1) * per_page
      if (skip && skip >= total) throw V.httpErrors.notFound()

      let cursor = await Posts.find(query, {
        projection: { content: 0 }
      })

      if (qs.sort === 'updated') {
        cursor = cursor.sort({ updated: -1 })
      } else {
        cursor = cursor.sort({ priority: -1, published: -1 })
      }

      const posts = await cursor.skip(skip).limit(per_page).toArray()

      return {
        items: posts,
        total
      }
    }
  )

  V.post(
    '/',
    {
      schema: {
        body: S.object()
          .prop('priority', S.integer().minimum(-1))
          .prop('slug', S.string().required())
          .prop('title', S.string())
          .prop('summary', S.string())
          .prop('content', S.string())
          .prop('published', S.integer())
          .prop('updated', S.integer())
          .prop('public', S.boolean())
      },
      preValidation: [V.auth.admin]
    },
    async (req) => {
      const { body } = <any>req
      if (!('published' in body)) {
        body.published = body.updated = Date.now()
      } else if (!('updated' in body)) {
        body.updated = body.published
      }
      const r = await Posts.insertOne({
        priority: body.priority ?? 0,
        slug: body.slug,
        title: body.title ?? body.slug,
        summary: body.summary ?? '',
        content: body.content ?? '',
        published: new Date(body.published),
        updated: new Date(body.updated),
        public: body.public ?? false,
        tags: []
      })
      return r.insertedId
    }
  )

  V.get(
    '/:idOrSlug',
    {
      schema: {
        params: ObjectIdOrSlugSchema,
        response: { 200: PostDTO }
      }
    },
    async (req) => {
      const { params } = <any>req
      const query: FilterQuery<IPostDoc> = {}
      if (!req.ctx.user?.perm.admin) {
        query.public = true
      }
      if (isObjectId(params.idOrSlug)) {
        query._id = new ObjectId(params.idOrSlug)
      } else {
        query.slug = params.idOrSlug
      }

      const post = await Posts.findOne(query)
      if (!post) {
        throw V.httpErrors.notFound()
      }

      return post
    }
  )

  V.put(
    '/:id',
    {
      schema: {
        params: ObjectIdSchema,
        body: S.object()
          .prop('priority', S.integer().minimum(-1))
          .prop('slug', S.string())
          .prop('title', S.string())
          .prop('content', S.string())
          .prop('summary', S.string())
          .prop('published', S.integer())
          .prop('updated', S.integer())
          .prop('public', S.boolean())
      },
      preValidation: [V.auth.admin]
    },
    async (req) => {
      const { body, params } = <any>req

      if (Object.keys(body).length <= 0) throw V.httpErrors.badRequest()
      if ('published' in body) {
        body.published = new Date(body.published)
      }
      if ('updated' in body) {
        body.updated = new Date(body.updated)
      }

      const update: UpdateQuery<IPostDoc> = {
        $set: body
      }

      await Posts.updateOne({ _id: new ObjectId(params.id) }, update)
      return true
    }
  )

  V.delete(
    '/:id',
    {
      schema: { params: ObjectIdSchema },
      preValidation: [V.auth.admin]
    },
    async (req) => {
      const { params } = <any>req
      const _id = new ObjectId(params.id)
      await Posts.deleteOne({ _id })
      return true
    }
  )

  V.put(
    '/:id/tag/:tagId',
    {
      schema: {
        params: ObjectIdSchema.prop('tagId', S.string())
      },
      preValidation: [V.auth.admin]
    },
    async (req) => {
      const { params } = <any>req
      const _id = new ObjectId(params.id)
      const _tagId = new ObjectId(params.tagId)

      const post = await Posts.findOne({ _id }, { projection: { tags: 1 } })
      if (!post) throw V.httpErrors.notFound()
      if (post.tags.some((x) => x._id.equals(_tagId))) return false

      const tag = await Tags.findOne({ _id: _tagId })
      if (!tag) throw V.httpErrors.notFound()
      await Posts.updateOne(
        { _id },
        { $push: { tags: { _id: _tagId, slug: tag.slug, title: tag.title } } }
      )
      return true
    }
  )

  V.delete(
    '/:id/tag/:tagId',
    {
      schema: {
        params: ObjectIdSchema.prop('tagId', S.string())
      },
      preValidation: [V.auth.admin]
    },
    async (req) => {
      const { params } = <any>req
      const _id = new ObjectId(params.id)
      const _tagId = new ObjectId(params.tagId)

      const post = await Posts.findOne({ _id }, { projection: { tags: 1 } })
      if (!post) throw V.httpErrors.notFound()
      if (!post.tags.some((x) => x._id.equals(_tagId)))
        throw V.httpErrors.notFound()

      await Posts.updateOne({ _id }, { $pull: { tags: { _id: _tagId } } })
      return true
    }
  )
}
