import * as semver from 'semver'
import { getClient, getDb, S_COL_META, S_KEY_DB_VERSION } from '../utils'
import { logger } from '../log'
import { DI, K_APP_MITIGATION } from '../utils'
import { IMetaDoc } from '../db'
import { Db, MongoClient } from 'mongodb'

type MitigationFn = (client: MongoClient, db: Db) => Promise<void>

const mitigations = new Map<string, MitigationFn>()

DI.step(K_APP_MITIGATION, async () => {
  const client = await getClient()
  const db = await getDb()
  const Metas = db.collection<IMetaDoc>(S_COL_META)

  const M = [...mitigations.entries()]
  M.sort((a, b) => semver.compare(a[0], b[0]))

  for (const [ver, fn] of M) {
    const cur = await Metas.findOne({ _id: S_KEY_DB_VERSION })
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (semver.lt(cur!.value, ver)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      logger.info(`Mitigate from ${cur!.value} to ${ver}`)
      await fn(client, db)
      await Metas.updateOne({ _id: S_KEY_DB_VERSION }, { $set: { value: ver } })
    }
  }
})

function defineMitigation(version: string, fn: MitigationFn) {
  mitigations.set(version, fn)
}

defineMitigation('0.0.0', async () => {
  logger.info('Nothing to mitigation')
})
