import S from 'fluent-schema'
import fp from 'fastify-plugin'
import fastifyJwt from 'fastify-jwt'
import { Db, ObjectId } from 'mongodb'
import { IMetaDoc, IUserDoc } from '../db'
import {
  DI,
  K_DB,
  notNull,
  S_COL_META,
  S_COL_USER,
  S_KEY_JWT_SECRET,
  verifyPassword
} from '../utils'
import { FastifyRequest } from 'fastify'

export const authPlugin = fp(async (V) => {
  const db = await DI.waitFor<Db>(K_DB)
  const metas = db.collection<IMetaDoc>(S_COL_META)
  const users = db.collection<IUserDoc>(S_COL_USER)
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const jwtMeta = (await metas.findOne({ _id: S_KEY_JWT_SECRET }))!
  V.register(fastifyJwt, { secret: jwtMeta.value })

  V.decorate('auth:login', async (req: FastifyRequest) => {
    const r = <any>await req.jwtVerify()
    if (!r._id) throw V.httpErrors.forbidden()
    const user = await users.findOne(
      { _id: new ObjectId(r._id) },
      { projection: { pass: 0 } }
    )
    if (!user) throw V.httpErrors.forbidden()
    req['ctx:user'] = user
  })

  V.decorate('auth:admin', async (req: FastifyRequest) => {
    if (!req['ctx:user'].perm.admin) throw V.httpErrors.forbidden()
  })

  V.post(
    '/login',
    {
      schema: {
        body: S.object().prop('login', S.string()).prop('pass', S.string())
      }
    },
    async (req) => {
      const body = <any>req.body
      const user = await users.findOne(
        { login: body.login },
        { projection: { pass: 1 } }
      )
      notNull(user)
      await verifyPassword(body.pass, user.pass)
      const token = V.jwt.sign({ _id: user._id })
      return token
    }
  )

  V.get('/session', { preValidation: [V['auth:login']] }, async (req) => {
    return req['ctx:user']
  })
})
