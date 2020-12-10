import { FastifyPluginAsync } from 'fastify'
import { FilterQuery, ObjectId, UpdateQuery } from 'mongodb'
import { getCollections, IMetaDoc } from '../db'
import { getDb, isObjectId } from '../utils'
import {
  MetaDTO,
  ObjectIdOrSlugSchema,
  ObjectIdSchema,
  paginationResult,
  S
} from './common'

export const metaPlugin: FastifyPluginAsync = async (V) => {
  const { Metas } = getCollections(await getDb())

  V.get(
    '/',
    {
      schema: {
        response: {
          200: paginationResult(MetaDTO)
        }
      },
      preValidation: [V.auth.admin]
    },
    async (req) => {
      const query: FilterQuery<IMetaDoc> = {}
      if (!req.ctx.user?.perm.admin) {
        query.public = true
      }
      const metas = await Metas.find(query).toArray()
      return {
        items: metas,
        total: metas.length
      }
    }
  )

  V.post(
    '/',
    {
      schema: {
        body: S.object()
          .prop('slug', S.string().minLength(1))
          .required()
          .prop('value')
          .required()
          .prop('public', S.boolean())
          .required()
      },
      preValidation: [V.auth.admin]
    },
    async (req) => {
      const { body } = <any>req
      if (body.slug.startsWith('$')) {
        throw V.httpErrors.badRequest(
          'User-defined meta slug cannot be $-prefixed'
        )
      }

      const r = await Metas.insertOne(body)
      return r.insertedId
    }
  )

  V.get(
    '/:idOrSlug',
    {
      schema: {
        params: ObjectIdOrSlugSchema
      }
    },
    async (req) => {
      const { params } = <any>req
      const query: FilterQuery<IMetaDoc> = {}
      if (!req.ctx.user?.perm.admin) {
        query.public = true
      }
      if (isObjectId(params.idOrSlug)) {
        query._id = new ObjectId(params.idOrSlug)
      } else {
        query.slug = params.idOrSlug
      }

      const meta = await Metas.findOne(query)
      if (!meta) {
        throw V.httpErrors.notFound()
      }

      return meta
    }
  )

  V.put(
    '/:id',
    {
      schema: {
        params: ObjectIdSchema,
        body: S.object()
          .prop('slug', S.string().minLength(1))
          .prop('value')
          .prop('public', S.boolean())
      },
      preValidation: [V.auth.admin]
    },
    async (req) => {
      const { body, params } = <any>req

      if (Object.keys(body).length <= 0) throw V.httpErrors.badRequest()

      const _id = new ObjectId(params.id)
      const meta = await Metas.findOne({ _id })
      if (!meta) {
        throw V.httpErrors.notFound()
      }
      if (meta.slug.startsWith('$$')) {
        throw V.httpErrors.badRequest(
          'Protected system meta cannot be modified'
        )
      }
      if (body.slug) {
        if (meta.slug.startsWith('$')) {
          if (body.slug !== meta.slug) {
            throw V.httpErrors.badRequest('System meta cannot be renamed')
          }
        } else {
          if (body.slug.startsWith('$')) {
            throw V.httpErrors.badRequest(
              'User-defined meta slug cannot be $-prefixed'
            )
          }
        }
      }

      const update: UpdateQuery<IMetaDoc> = {
        $set: body
      }

      await Metas.updateOne({ _id }, update)
      return true
    }
  )

  V.delete(
    '/:id',
    {
      schema: {
        params: ObjectIdSchema
      },
      preValidation: [V.auth.admin]
    },
    async (req) => {
      const { params } = <any>req
      const _id = new ObjectId(params.id)
      const meta = await Metas.findOne({ _id })
      if (!meta) {
        throw V.httpErrors.notFound()
      }
      if (meta.slug.startsWith('$')) {
        throw V.httpErrors.badRequest('System meta cannot be deleted')
      }
      await Metas.deleteOne({ _id })
      return true
    }
  )
}
