import { Db, ObjectId } from 'mongodb'

export interface IMetaDoc {
  _id: string
  value: any
}

export interface ITagEmbeddedDoc {
  _id: ObjectId
  slug: string
  title: string
}

export interface IUserEmbeddedDoc {
  _id: ObjectId
  name: string
  email: string
}

export interface IPostDoc {
  _id: ObjectId
  slug: string
  priority: number
  title: string
  summary: string
  content: string
  published: Date
  public: boolean
  tags: ITagEmbeddedDoc[]
}

export interface IUserPass {
  hash: string
  salt: string
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
}

export interface ITagDoc {
  _id: ObjectId
  slug: string
  title: string
}

export function getCollections(db: Db) {
  return {
    Metas: db.collection<IMetaDoc>('meta'),
    Posts: db.collection<IPostDoc>('post'),
    Users: db.collection<IUserDoc>('user'),
    Tags: db.collection<ITagDoc>('tag')
  }
}
