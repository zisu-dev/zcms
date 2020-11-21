import { FastifyPluginAsync } from 'fastify'
import { Db, FilterQuery, ObjectId, UpdateQuery } from 'mongodb'
import { IPostDoc } from '../db'
import { DI, K_DB, S_COL_POST } from '../utils'
import { ObjectIdParamsSchema, S } from './common'

export const postPlugin: FastifyPluginAsync = async (V) => {
  const db = await DI.waitFor<Db>(K_DB)
  const Posts = db.collection<IPostDoc>(S_COL_POST)

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
}
