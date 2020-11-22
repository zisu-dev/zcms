import { FastifyPluginAsync } from 'fastify'
import { Db, FilterQuery, ObjectId, UpdateQuery } from 'mongodb'
import { IPostDoc, ITagDoc } from '../db'
import { DI, K_DB, S_COL_POST, S_COL_TAG } from '../utils'
import { ObjectIdParamsSchema, S } from './common'

export const postPlugin: FastifyPluginAsync = async (V) => {
  const db = await DI.waitFor<Db>(K_DB)
  const Posts = db.collection<IPostDoc>(S_COL_POST)
  const Tags = db.collection<ITagDoc>(S_COL_TAG)

  V.get(
    '/',
    {
      schema: {
        querystring: S.object()
          .prop('offset', S.integer().required())
          .prop('limit', S.integer().minimum(1).maximum(50).required())
      }
    },
    async (req) => {
      const offset: number = (<any>req.query).offset
      const limit: number = (<any>req.query).limit
      const query: FilterQuery<IPostDoc> = {}
      if (!('ctx:user' in req) || !req['ctx:user'].perm.admin) {
        query.public = true
      }
      const posts = await Posts.find(query, {})
        .sort({ priority: -1, published: -1 })
        .skip(offset)
        .limit(limit)
        .toArray()
      return posts
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
          .prop('content', S.string().required())
          .prop('summary', S.string().required())
          .prop('published', S.integer().required())
          .prop('public', S.boolean().required())
          .prop('tags', S.array().items(S.string()).required())
      },
      preValidation: [V['auth:login'], V['auth:admin']]
    },
    async (req) => {
      const body = <any>req.body
      const r = await Posts.insertOne({
        priority: body.priority,
        slug: body.slug,
        title: body.title,
        content: body.content,
        summary: body.summary,
        published: new Date(body.published),
        public: body.public,
        tags: body.tags,
        author: {
          _id: req['ctx:user']._id,
          name: req['ctx:user'].name,
          email: req['ctx:user'].email
        }
      })
      return r.insertedId
    }
  )

  V.get('/:id', { schema: { params: ObjectIdParamsSchema } }, async (req) => {
    const post = await Posts.findOne({
      _id: new ObjectId((<any>req.params).id)
    })
    if (!post) throw V.httpErrors.notFound()
  })

  V.put(
    '/:id',
    {
      schema: {
        params: ObjectIdParamsSchema,
        body: S.object()
          .prop('priority', S.integer())
          .prop('slug', S.string())
          .prop('title', S.string())
          .prop('content', S.string())
          .prop('summary', S.string())
          .prop('published', S.integer())
          .prop('public', S.boolean())
          .prop('tags', S.array().items(S.string()))
      },
      preValidation: [V['auth:login'], V['auth:admin']]
    },
    async (req) => {
      const body = <any>req.body

      const update: UpdateQuery<IPostDoc> = {
        $set: body
      }

      await Posts.updateOne({ _id: new ObjectId((<any>req.params).id) }, update)
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
      const _id = new ObjectId((<any>req.params).id)
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
      const _id = new ObjectId((<any>req.params).id)
      const _tagId = new ObjectId((<any>req.params).tagId)
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
      const _id = new ObjectId((<any>req.params).id)
      const _tagId = new ObjectId((<any>req.params).tagId)
      const post = await Posts.findOne({ _id }, { projection: { tags: 1 } })
      if (!post) throw V.httpErrors.notFound()
      if (!post.tags.some((x) => x._id.equals(_tagId)))
        throw V.httpErrors.notFound()
      await Posts.updateOne({ _id }, { $pull: { tags: { _id: _tagId } } })
      return true
    }
  )
}
