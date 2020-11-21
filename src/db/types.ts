import { ObjectId } from 'mongodb'

export interface IMetaDoc {
  _id: string
  value: any
}

export interface ITagEmbeddedDoc {
  _id: ObjectId
  title: string
}

export interface IUserEmbeddedDoc {
  _id: string
  name: string
  email: string
}

export interface IPostDoc {
  _id: ObjectId
  priority: number
  slug: string
  title: string
  content: string
  summary: string
  published: Date
  public: boolean
  tags: string[]
  author: IUserEmbeddedDoc
}

export interface IUserPass {
  hash: string
  salt: string
}

export interface IUserDoc {
  _id: string
  name: string
  email: string
  pass: IUserPass
  perm: {
    admin?: boolean
    comment?: boolean
  }
}
