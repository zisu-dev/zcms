import { Db, MongoClient } from 'mongodb'
import { DI } from './di'
import { K_DB, K_DB_CLIENT } from './symbols'

export function getDb(): Promise<Db> {
  return DI.waitFor<Db>(K_DB)
}

export function getClient(): Promise<MongoClient> {
  return DI.waitFor<MongoClient>(K_DB_CLIENT)
}
