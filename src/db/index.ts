import { MongoClient } from 'mongodb'
import { DI, K_DB, K_DB_CLIENT } from '../utils'
export * from './types'

DI.step(K_DB_CLIENT, async () => {
  const url = 'mongodb://localhost:27017'

  const client = new MongoClient(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  await client.connect()
  return client
})

DI.step(K_DB, async () => {
  const dbName = 'zcms'

  const client = await DI.waitFor<MongoClient>(K_DB_CLIENT)
  const db = client.db(dbName)

  return db
})
