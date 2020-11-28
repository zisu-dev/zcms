import { FastifyPluginAsync } from 'fastify'
import { Db, FilterQuery, ObjectId, UpdateQuery } from 'mongodb'
import { getCollections, IPostDoc } from '../db'
import { DI, K_DB } from '../utils'
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
          .prop('tag', S.string().minLength(1)),
        response: {
          200: paginationResult(PostDTO)
        }
      }
    },
    async (req) => {
      const { query: qs } = <any>req
      const { page, per_page } = qs

      const query: FilterQuery<IPostDoc> = {}
      if (req['ctx:user'] === null || !req['ctx:user'].perm.admin) {
        query.public = true
      }
      if ('search' in qs) {
        query.content = new RegExp(qs.search)
      }
      if ('tag' in qs) {
        query['tags._id'] = new ObjectId(qs.tag)
      }
      const total = await Posts.countDocuments(query)
      const skip = (page - 1) * per_page
      if (skip && skip >= total) throw V.httpErrors.notFound()

      const posts = await Posts.find(query, {
        projection: { content: 0 }
      })
        .sort({ priority: -1, published: -1 })
        .skip(skip)
        .limit(per_page)
        .toArray()

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
          .prop('priority', S.integer().required())
          .prop('slug', S.string().required())
          .prop('title', S.string().required())
          .prop('summary', S.string().required())
          .prop('content', S.string().required())
          .prop('published', S.integer().required())
          .prop('public', S.boolean().required())
      },
      preValidation: [V['auth:login'], V['auth:admin']]
    },
    async (req) => {
      const { body } = <any>req
      const r = await Posts.insertOne({
        priority: body.priority,
        slug: body.slug,
        title: body.title,
        summary: body.summary,
        content: body.content,
        published: new Date(body.published),
        public: body.public,
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
      const post = await Posts.findOne(
        ObjectId.isValid(params.idOrSlug)
          ? { _id: new ObjectId(params.idOrSlug) }
          : { slug: params.idOrSlug }
      )
      if (!post) throw V.httpErrors.notFound()
      return post
    }
  )

  V.put(
    '/:id',
    {
      schema: {
        params: ObjectIdSchema,
        body: S.object()
          .prop('priority', S.integer())
          .prop('slug', S.string())
          .prop('title', S.string())
          .prop('content', S.string())
          .prop('summary', S.string())
          .prop('published', S.integer())
          .prop('public', S.boolean())
      },
      preValidation: [V['auth:login'], V['auth:admin']]
    },
    async (req) => {
      const { body, params } = <any>req

      if (Object.keys(body).length <= 0) throw V.httpErrors.badRequest()
      if ('published' in body) {
        body.published = new Date(body.published)
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
      schema: { params: S.object().prop('id', S.string()) },
      preValidation: [V['auth:login'], V['auth:admin']]
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
        params: S.object().prop('id', S.string()).prop('tagId', S.string())
      },
      preValidation: [V['auth:login'], V['auth:admin']]
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
        params: S.object().prop('id', S.string()).prop('tagId', S.string())
      },
      preValidation: [V['auth:login'], V['auth:admin']]
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
