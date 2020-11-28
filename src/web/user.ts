import { FastifyPluginAsync } from 'fastify'
import { Db, ObjectId, UpdateQuery } from 'mongodb'
import { getCollections, IUserDoc } from '../db'
import { DI, generatePasswordPair, K_DB } from '../utils'
import {
  ObjectIdOrSlugSchema,
  ObjectIdSchema,
  paginationResult,
  S,
  UserDTO
} from './common'

export const userPlugin: FastifyPluginAsync = async (V) => {
  const db = await DI.waitFor<Db>(K_DB)
  const { Users, Posts } = getCollections(db)

  V.get(
    '/',
    {
      preValidation: [V['auth:login'], V['auth:admin']],
      schema: {
        response: {
          200: paginationResult(UserDTO)
        }
      }
    },
    async () => {
      const users = await Users.find({}, { projection: { pass: 0 } }).toArray()
      return {
        items: users,
        total: users.length
      }
    }
  )

  V.get(
    '/:idOrSlug',
    {
      schema: {
        params: ObjectIdOrSlugSchema,
        response: {
          200: UserDTO
        }
      }
    },
    async (req) => {
      const { params } = <any>req
      const user = await Users.findOne(
        ObjectId.isValid(params.idOrSlug)
          ? { _id: new ObjectId(params.idOrSlug) }
          : { slug: params.idOrSlug },
        { projection: { pass: 0 } }
      )
      if (!user) throw V.httpErrors.notFound()
      return user
    }
  )

  V.put(
    '/:id',
    {
      schema: {
        params: ObjectIdSchema,
        body: S.object()
          .prop('name', S.string().minLength(3).maxLength(20))
          .prop('email', S.string().pattern(/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/))
          .prop('pass', S.string().minLength(6))
      },
      preValidation: [V['auth:login']]
    },
    async (req) => {
      const { params, body } = <any>req
      const _id = new ObjectId(params.id)
      if (!_id.equals(req['ctx:user']._id)) throw V.httpErrors.forbidden()

      const update: UpdateQuery<IUserDoc> = {
        $set: {}
      }
      if ('name' in body) {
        update.$set = {
          ...update.$set,
          name: body.name
        }
      }
      if ('email' in body) {
        update.$set = {
          ...update.$set,
          email: body.email
        }
      }
      if ('pass' in body) {
        update.$set = {
          ...update.$set,
          pass: await generatePasswordPair(body.pass)
        }
      }

      const { value: user } = await Users.findOneAndUpdate({ _id }, update, {
        returnOriginal: false
      })
      return true
    }
  )
}
