import { FastifyPluginAsync } from 'fastify'
import { Db, FilterQuery, ObjectId } from 'mongodb'
import { getCollections, IPostDoc } from '../db'
import { DI, K_DB } from '../utils'
import { S, paginationResult, PostDTO } from './common'

export const pagePlugin: FastifyPluginAsync = async (V) => {
  const db = await DI.waitFor<Db>(K_DB)
  const { Posts } = getCollections(db)

  V.get(
    '/',
    {
      schema: {
        querystring: S.object()
          .prop('page', S.integer().minimum(1).required())
          .prop('per_page', S.integer().minimum(1).maximum(50).required())
          .prop('search', S.string().minLength(1).maxLength(128))
          .prop('tag', S.string().minLength(1)),
        response: {
          200: paginationResult(PostDTO)
        }
      }
    },
    async (req) => {
      const { query: qs } = <any>req
      const { page, per_page } = qs

      const query: FilterQuery<IPostDoc> = {
        priority: -1
      }
      if (!req['ctx:user']?.perm.admin) {
        query.public = true
      }
      if ('search' in qs) {
        query.content = new RegExp(qs.search)
      }
      if ('tag' in qs) {
        query['tags._id'] = new ObjectId(qs.tag)
      }
      const total = await Posts.countDocuments(query)
      const skip = (page - 1) * per_page
      if (skip && skip >= total) throw V.httpErrors.notFound()

      const posts = await Posts.find(query, {
        projection: { content: 0 }
      })
        .sort({ priority: -1, published: -1 })
        .skip(skip)
        .limit(per_page)
        .toArray()

      return {
        items: posts,
        total
      }
    }
  )
}
