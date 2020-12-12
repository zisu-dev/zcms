import { FastifyPluginAsync } from 'fastify'
import { githubOAuthPlugin } from './github'

export const oAuthPlugin: FastifyPluginAsync = async (V) => {
  V.register(githubOAuthPlugin, { prefix: '/github' })
}
