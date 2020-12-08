import * as semver from 'semver'
import { getClient, getDb, S_KEY_DB_VERSION } from '../utils'
import { logger } from '../log'
import { DI, K_APP_MITIGATION } from '../utils'
import { getCollections, ZCMSCollections } from '../db'
import { Db, MongoClient } from 'mongodb'
import { Logger } from 'pino'

type MitigationFn = (args: {
  client: MongoClient
  db: Db
  logger: Logger
  cols: ZCMSCollections
}) => Promise<void>

const mitigations = new Map<string, MitigationFn>()

DI.step(K_APP_MITIGATION, async () => {
  const client = await getClient()
  const db = await getDb()
  const { Metas } = getCollections(db)

  const M = [...mitigations.entries()]
  M.sort((a, b) => semver.compare(a[0], b[0]))

  for (const [ver, fn] of M) {
    const cur = await Metas.findOne({ slug: S_KEY_DB_VERSION })
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (semver.lt(cur!.value, ver)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      logger.info(`Mitigate from ${cur!.value} to ${ver}`)
      await fn({ client, db, logger, cols: getCollections(db) })
      await Metas.updateOne(
        { slug: S_KEY_DB_VERSION },
        { $set: { value: ver } }
      )
    }
  }
})

export function defineMitigation(version: string, fn: MitigationFn) {
  mitigations.set(version, fn)
}
