import { ObjectId } from 'mongodb'

export interface IMetaDoc {
  _id: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any
}

export interface IContentDoc {
  _id: ObjectId
  title: string
  content: string
  summary: string
  created: Date
  updated: Date
  tags: ObjectId[]
  author: ObjectId
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
