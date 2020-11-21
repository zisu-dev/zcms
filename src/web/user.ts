import { FastifyPluginAsync } from 'fastify'
import { Db, UpdateQuery } from 'mongodb'
import { IPostDoc, IUserDoc } from '../db'
import {
  DI,
  generatePasswordPair,
  K_DB,
  S_COL_POST,
  S_COL_USER
} from '../utils'
import { S, UserIdParamsSchema } from './common'

export const userPlugin: FastifyPluginAsync = async (V) => {
  const db = await DI.waitFor<Db>(K_DB)
  const Users = db.collection<IUserDoc>(S_COL_USER)
  const Posts = db.collection<IPostDoc>(S_COL_POST)

  V.get(
    '/list',
    { preValidation: [V['auth:login'], V['auth:admin']] },
    async () => {
      const users = await Users.find({}, { projection: { pass: 0 } }).toArray()
      return users
    }
  )

  V.get(
    '/:id',
    {
      schema: {
        params: UserIdParamsSchema
      }
    },
    async (req) => {
      const user = await Users.findOne(
        {
          _id: (<any>req.params).id
        },
        { projection: { pass: 0 } }
      )
      return user
    }
  )

  V.put(
    '/:id',
    {
      schema: {
        params: UserIdParamsSchema,
        body: S.object()
          .prop('name', S.string().minLength(3).maxLength(20))
          .prop('email', S.string().pattern(/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/))
          .prop('pass', S.string().minLength(6))
      },
      preValidation: [V['auth:login']]
    },
    async (req) => {
      const _id = (<any>req.params).id
      if (req['ctx:user']._id !== _id) throw V.httpErrors.forbidden()

      const body = <any>req.body
      const update: UpdateQuery<IUserDoc> = {
        $set: {}
      }
      const postUpdate: UpdateQuery<IPostDoc> = {
        $set: {}
      }
      if ('name' in body) {
        update.$set = {
          ...update.$set,
          name: body.name
        }
        postUpdate.$set = {
          ...postUpdate.$set,
          'author.name': body.name
        }
      }
      if ('email' in body) {
        update.$set = {
          ...update.$set,
          email: body.email
        }
        postUpdate.$set = {
          ...postUpdate.$set,
          'author.email': body.email
        }
      }
      if ('pass' in body) {
        update.$set = {
          ...update.$set,
          pass: await generatePasswordPair(body.pass)
        }
      }

      await Users.updateOne({ _id }, update)
      if ('name' in body || 'email' in body) {
        await Posts.updateMany({ 'author._id': _id }, postUpdate)
      }
      return true
    }
  )
}
