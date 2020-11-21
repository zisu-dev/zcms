import S from 'fluent-schema'
import { FastifyPluginAsync } from 'fastify'
import { Db, ObjectId } from 'mongodb'
import { IUserDoc } from '../db'
import { DI, K_DB, S_COL_USER } from '../utils'

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
    '/info/:id',
    {
      schema: {
        params: S.object().prop('id', S.string().minLength(1))
      }
    },
    async (req) => {
      const user = await Users.findOne(
        {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          _id: new ObjectId((<any>req.params).id)
        },
        { projection: { pass: 0 } }
      )
      return user
    }
  )
}
