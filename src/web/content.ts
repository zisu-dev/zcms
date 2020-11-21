import { FastifyPluginAsync } from 'fastify'
import { Db, ObjectId } from 'mongodb'
import { IPostDoc } from '../db'
import { DI, K_DB, S_COL_POST } from '../utils'
import { ObjectIdParamsSchema } from './common'

export const contentPlugin: FastifyPluginAsync = async (V) => {
  const db = await DI.waitFor<Db>(K_DB)
  const Posts = db.collection<IPostDoc>(S_COL_POST)

  V.get('/list', {}, async (req) => {
    return ''
  })

  V.get('/:id', { schema: { params: ObjectIdParamsSchema } }, async (req) => {
    const post = await Posts.findOne({
      _id: new ObjectId((<any>req.params).id)
    })
    if (!post) throw V.httpErrors.notFound()
  })
}
