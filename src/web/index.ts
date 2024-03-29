import fastify from 'fastify'
import fastifySensible from 'fastify-sensible'
import fastifyCors from 'fastify-cors'
import fastifyStatic from 'fastify-static'
import { logger } from '../log'
import { DI, K_WEB, __args, __package } from '../utils'
import { authPlugin } from './auth'
import { postPlugin } from './post'
import { tagPlugin } from './tag'
import { userPlugin } from './user'
import { noAdditionalProperties } from './no_additional_properties'
import { adminPlugin } from './admin'
import { pagePlugin } from './page'
import { metaPlugin } from './meta'
import { oAuthPlugin } from './oauth'

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

  let origin: string | RegExp | (string | RegExp)[] = __args.origin
    .split(',')
    .map((x) => x.trim())
    .map((x) => (x.startsWith('regex:') ? new RegExp(x.substr(6)) : x))
  if (origin.length === 1) origin = origin[0]
  logger.info(
    'Allowed origins: ' +
      (origin instanceof Array ? `[${origin.join()}]` : origin)
  )
  await server.register(fastifyCors, { origin, credentials: true })

  await server.register(fastifySensible)
  await server.register(noAdditionalProperties)
  await server.register(fastifyStatic, { root: __args.staticPath })

  await server.register(authPlugin)
  await server.register(oAuthPlugin, { prefix: '/oauth' })
  await server.register(userPlugin, { prefix: '/user' })
  await server.register(postPlugin, { prefix: '/post' })
  await server.register(pagePlugin, { prefix: '/page' })
  await server.register(tagPlugin, { prefix: '/tag' })
  await server.register(metaPlugin, { prefix: '/meta' })
  await server.register(adminPlugin, { prefix: '/admin' })
  await server.listen(8010, '0.0.0.0')
  return server
})
