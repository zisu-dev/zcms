import { FastifyPluginAsync } from 'fastify'
import { Db, ObjectId, UpdateQuery } from 'mongodb'
import { getCollections, ITagDoc } from '../db'
import { DI, K_DB } from '../utils'
import { ObjectIdOrSlugSchema, paginationResult, S, TagDTO } from './common'

export const tagPlugin: FastifyPluginAsync = async (V) => {
  const db = await DI.waitFor<Db>(K_DB)
  const { Posts, Tags } = getCollections(db)

  V.get(
    '/',
    {
      schema: {
        response: {
          200: paginationResult(TagDTO)
        }
      }
    },
    async (req) => {
      const tags = await Tags.find().toArray()
      return {
        items: tags,
        total: tags.length
      }
    }
  )

  V.post(
    '/',
    {
      schema: {
        body: S.object()
          .prop('slug', S.string().required())
          .prop('title', S.string().required())
          .prop('content', S.string().required())
      },
      preValidation: [V['auth:login'], V['auth:admin']]
    },
    async (req) => {
      const {
        body: { slug, title, content }
      } = <any>req

      const r = await Tags.insertOne({
        slug,
        title,
        content
      })
      return r.insertedId
    }
  )

  V.get(
    '/:idOrSlug',
    {
      schema: {
        params: ObjectIdOrSlugSchema,
        response: {
          200: TagDTO
        }
      }
    },
    async (req) => {
      const { params } = <any>req
      const tag = await Tags.findOne(
        ObjectId.isValid(params.idOrSlug)
          ? { _id: new ObjectId(params.idOrSlug) }
          : { slug: params.idOrSlug }
      )
      if (!tag) throw V.httpErrors.notFound()
      return tag
    }
  )

  V.put(
    '/:id',
    {
      schema: {
        params: S.object().prop('id', S.string()),
        body: S.object()
          .prop('slug', S.string())
          .prop('title', S.string())
          .prop('content', S.string())
      },
      preValidation: [V['auth:login'], V['auth:admin']]
    },
    async (req) => {
      const { params, body } = <any>req
      const _id = new ObjectId(params.id)

      if (Object.keys(body).length <= 0) throw V.httpErrors.badRequest()

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
