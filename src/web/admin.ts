import { FastifyPluginAsync } from 'fastify'
import { Db, ObjectId, UpdateQuery } from 'mongodb'
import { getCollections, ITagDoc } from '../db'
import { DI, K_DB, __package } from '../utils'
import { ObjectIdOrSlugSchema, paginationResult, S, TagDTO } from './common'

export const adminPlugin: FastifyPluginAsync = async (V) => {
  const db = await DI.waitFor<Db>(K_DB)
  const { Posts, Tags, Users } = getCollections(db)

  V.addHook('preValidation', V['auth:login'])
  V.addHook('preValidation', V['auth:admin'])

  V.get('/stat', async () => {
    return {
      db: await db.stats(),
      posts: await Posts.countDocuments(),
      users: await Users.countDocuments(),
      tags: await Tags.countDocuments(),
      version: __package.version
    }
  })
}
