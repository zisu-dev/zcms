import fastify from 'fastify'
import fastifySensible from 'fastify-sensible'
import { logger } from '../log'
import { DI, K_WEB } from '../utils'
import { authPlugin } from './auth'
import { userPlugin } from './user'

DI.step(K_WEB, async () => {
  const server = fastify({
    logger
  })
  await server.register(fastifySensible)
  await server.register(authPlugin)
  await server.register(userPlugin, { prefix: '/user' })
  await server.listen(8010)
  return server
})
