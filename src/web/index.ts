import fastify from 'fastify'
import fastifySensible from 'fastify-sensible'
import fastifyCors from 'fastify-cors'
import { logger } from '../log'
import { DI, K_WEB, __args, __package } from '../utils'
import { authPlugin } from './auth'
import { postPlugin } from './post'
import { tagPlugin } from './tag'
import { userPlugin } from './user'

DI.step(K_WEB, async () => {
  const server = fastify({
    logger
  })
  if (__args.dev) {
    await server.register(require('fastify-swagger'), {
      swagger: {
        info: {
          title: 'ZCMS',
          description: 'ZhangZisu CMS',
          version: __package.version
        }
      },
      exposeRoute: true
    })
  }
  await server.register(fastifyCors, { origin: true, credentials: true })
  await server.register(fastifySensible)
  await server.register(authPlugin)
  await server.register(userPlugin, { prefix: '/user' })
  await server.register(postPlugin, { prefix: '/post' })
  await server.register(tagPlugin, { prefix: '/tag' })
  await server.listen(8010)
  return server
})
