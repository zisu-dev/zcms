import { Binary, Collection, Db, ObjectId } from 'mongodb'
import { DI, K_DB, S_KEY_DB_VERSION } from '../utils'

export interface IMetaDoc {
  _id: ObjectId
  slug: string
  value: any
  public: boolean
}

export interface ITagEmbeddedDoc {
  _id: ObjectId
  slug: string
  title: string
}

export interface IPostDoc {
  _id: ObjectId
  slug: string
  priority: number // -1 For page, >= 0 for common post
  title: string
  summary: string
  content: string
  published: Date
  public: boolean
  tags: ITagEmbeddedDoc[]
}

export interface IUserPass {
  hash: Binary
  salt: Binary
}

export interface IUserDoc {
  _id: ObjectId
  slug: string
  name: string
  email: string
  pass: IUserPass
  perm: {
    admin?: boolean
    comment?: boolean
  }
  oauth: {
    github?: number
  }
}

export interface ITagDoc {
  _id: ObjectId
  slug: string
  title: string
  content: string
}

export function getCollections(db: Db) {
  return {
    Metas: db.collection<IMetaDoc>('meta'),
    Posts: db.collection<IPostDoc>('post'),
    Users: db.collection<IUserDoc>('user'),
    Tags: db.collection<ITagDoc>('tag')
  }
}

export async function getMetaValue(slug: string) {
  const db = await DI.waitFor<Db>(K_DB)
  const { Metas } = getCollections(db)
  const meta = await Metas.findOne({ slug })
  return meta!.value
}

export type ZCMSCollections = ReturnType<typeof getCollections>

export async function getDBVersion(db: Db) {
  const { Metas } = getCollections(db)
  const metaVer = await Metas.findOne({ slug: S_KEY_DB_VERSION })
  return metaVer?.value
}
