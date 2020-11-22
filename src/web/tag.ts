import { FastifyPluginAsync } from 'fastify'
import { Db, ObjectId, UpdateQuery } from 'mongodb'
import { IPostDoc, ITagDoc } from '../db'
import { DI, K_DB, S_COL_POST, S_COL_TAG } from '../utils'
import { S } from './common'

export const tagPlugin: FastifyPluginAsync = async (V) => {
  const db = await DI.waitFor<Db>(K_DB)
  const Posts = db.collection<IPostDoc>(S_COL_POST)
  const Tags = db.collection<ITagDoc>(S_COL_TAG)

  V.get('/', async (req) => {
    const tags = await Tags.find().toArray()
    return tags
  })

  V.post(
    '/',
    {
      schema: {
        body: S.object()
          .prop('slug', S.string().required())
          .prop('title', S.string().required())
      },
      preValidation: [V['auth:login'], V['auth:admin']]
    },
    async (req) => {
      const {
        body: { slug, title }
      } = <any>req

      const r = await Tags.insertOne({
        slug: slug,
        title: title
      })
      return r.insertedId
    }
  )

  V.put(
    '/:id',
    {
      schema: {
        params: S.object().prop('id', S.string()),
        body: S.object().prop('slug', S.string()).prop('title', S.string())
      },
      preValidation: [V['auth:login'], V['auth:admin']]
    },
    async (req) => {
      const { params, body } = <any>req
      const _id = new ObjectId(params.id)

      const update: UpdateQuery<ITagDoc> = {
        $set: body
      }
      const { value: tag } = await Tags.findOneAndUpdate({ _id }, update, {
        returnOriginal: false
      })
      if (tag) {
        await Posts.updateMany(
          { 'tags._id': _id },
          { $set: { 'tags.$.slug': tag.slug, 'tags.$.title': tag.title } }
        )
        return true
      } else {
        throw V.httpErrors.internalServerError()
      }
    }
  )

  V.delete(
    '/:id',
    {
      schema: {
        params: S.object().prop('id', S.string())
      },
      preValidation: [V['auth:login'], V['auth:admin']]
    },
    async (req) => {
      const { params } = <any>req
      const _id = new ObjectId(params.id)

      const { value: tag } = await Tags.findOneAndDelete({ _id })
      if (tag) {
        await Posts.updateMany({}, { $pull: { tags: { _id } } })
        return true
      } else {
        throw V.httpErrors.notFound()
      }
    }
  )
}
