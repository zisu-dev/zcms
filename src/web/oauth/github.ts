import { FastifyPluginAsync } from 'fastify'
import got from 'got'
import { Db } from 'mongodb'
import * as uuid from 'uuid'
import { getCollections, getMetaValue } from '../../db'
import {
  DI,
  generatePasswordPair,
  K_DB,
  notNull,
  S_KEY_OAUTH_CONFIG
} from '../../utils'
import { S, UserDTO } from '../common'

export const githubOAuthPlugin: FastifyPluginAsync = async (V) => {
  const oauthConfig = await getMetaValue(S_KEY_OAUTH_CONFIG)
  if (!('github' in oauthConfig)) return

  const db = await DI.waitFor<Db>(K_DB)
  const { Users } = getCollections(db)

  async function getUserInfo(token: string) {
    const { body } = await got('https://api.github.com/user', {
      headers: {
        Authorization: `token ${token}`
      },
      responseType: 'json'
    })
    return body as Record<string, any>
  }

  const { client_id, client_secret } = oauthConfig.github
  V.post(
    '/login',
    {
      schema: {
        body: S.object()
          .prop('code', S.string().required())
          .prop('state', S.string().required())
          .prop('expires', S.enum(['1d']).default('1d')),
        response: {
          200: S.object().prop('user', UserDTO).prop('token', S.string())
        }
      }
    },
    async (req) => {
      const {
        body: { code, state, expires }
      } = <any>req
      const {
        body: { access_token }
      } = await got('https://github.com/login/oauth/access_token', {
        searchParams: {
          client_id,
          client_secret,
          code,
          state
        },
        responseType: 'json'
      })
      const userInfo = await getUserInfo(access_token)
      const userId = userInfo.id as number
      const user = await Users.findOne({
        'oauth.github': userId
      })
      notNull(user)
      const token = V.jwt.sign({ _id: user._id }, { expiresIn: expires })
      return { user, token }
    }
  )

  V.post(
    '/register',
    {
      schema: {
        body: S.object()
          .prop('code', S.string().required())
          .prop('state', S.string().required())
          .prop('expires', S.enum(['1d']).default('1d')),
        response: {
          200: S.object().prop('user', UserDTO).prop('token', S.string())
        }
      }
    },
    async (req) => {
      const {
        body: { code, state, expires }
      } = <any>req
      const {
        body: { access_token }
      } = await got('https://github.com/login/oauth/access_token', {
        searchParams: {
          client_id,
          client_secret,
          code,
          state
        },
        responseType: 'json'
      })
      const userInfo = await getUserInfo(access_token)
      const r = await Users.insertOne({
        slug: uuid.v4(),
        name: userInfo.login,
        email: userInfo.email,
        pass: await generatePasswordPair(uuid.v4()),
        perm: {},
        oauth: { github: userInfo.id }
      })
      const user = r.ops[0]
      const token = V.jwt.sign({ _id: user._id }, { expiresIn: expires })
      return { user, token }
    }
  )

  V.post(
    '/link',
    {
      schema: {
        body: S.object()
          .prop('code', S.string().required())
          .prop('state', S.string().required())
      },
      preValidation: [V.auth.login]
    },
    async (req) => {
      const {
        body: { code, state }
      } = <any>req
      const {
        body: { access_token }
      } = await got('https://github.com/login/oauth/access_token', {
        searchParams: {
          client_id,
          client_secret,
          code,
          state
        },
        responseType: 'json'
      })
      const userInfo = await getUserInfo(access_token)
      const userId = userInfo.id as number
      await Users.updateOne(
        { _id: req.ctx.user!._id },
        { $set: { 'oauth.github': userId } }
      )
      return userId
    }
  )

  V.post(
    '/unlink',
    {
      preValidation: [V.auth.login]
    },
    async (req) => {
      await Users.updateOne(
        { _id: req.ctx.user!._id },
        { $unset: { 'oauth.github': '' } }
      )
      return true
    }
  )
}
