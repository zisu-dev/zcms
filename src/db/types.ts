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
  _id: ObjectId
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
  created: Date
  updated: Date
  tags: ITagEmbeddedDoc[]
  author: IUserEmbeddedDoc
}

export interface ITagDoc {
  _id: ObjectId
  title: string
}

export interface IUserPass {
  hash: string
  salt: string
}

export interface IUserDoc {
  _id: ObjectId
  login: string
  name: string
  email: string
  pass: IUserPass
  perm: {
    admin?: boolean
    comment?: boolean
  }
}
