import { Db } from 'mongodb'
import { getDBVersion } from '../db'
import './init'
import './mitigations'

export async function shouldInit(db: Db) {
  const ver = await getDBVersion(db)
  if (ver) return false
  return true
}
