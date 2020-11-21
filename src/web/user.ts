import { FastifyPluginAsync } from 'fastify'
import { Db, ObjectId, UpdateQuery } from 'mongodb'
import { IUserDoc } from '../db'
import { DI, generatePasswordPair, K_DB, S_COL_USER } from '../utils'
import { ObjectIdParamsSchema, S } from './common'

export const userPlugin: FastifyPluginAsync = async (V) => {
  const db = await DI.waitFor<Db>(K_DB)
  const Users = db.collection<IUserDoc>(S_COL_USER)

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
        params: ObjectIdParamsSchema
      }
    },
    async (req) => {
      const user = await Users.findOne(
        {
          _id: new ObjectId((<any>req.params).id)
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
        params: ObjectIdParamsSchema,
        body: S.object()
          .prop('name', S.string().minLength(3).maxLength(20))
          .prop('email', S.string().pattern(/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/))
          .prop('pass', S.string().minLength(6))
      },
      preValidation: [V['auth:login']]
    },
    async (req) => {
      const _id = new ObjectId((<any>req.params).id)
      if (!req['ctx:user']._id.equals(_id)) throw V.httpErrors.forbidden()

      const update: UpdateQuery<IUserDoc> = {
        $set: {}
      }
      if ((<any>req.body).name) {
        update.$set = {
          ...update.$set,
          name: (<any>req.body).name
        }
      }
      if ((<any>req.body).email) {
        update.$set = {
          ...update.$set,
          email: (<any>req.body).email
        }
      }
      if ((<any>req.body).pass) {
        update.$set = {
          ...update.$set,
          pass: await generatePasswordPair((<any>req.body).pass)
        }
      }

      await Users.updateOne({ _id }, update)
      return true
    }
  )
}
