import './db'
import './web'
import './mitigation'

import {
  DI,
  getDb,
  K_APP_INIT,
  K_APP_MITIGATION,
  K_WEB,
  randomBytesAsync,
  S_KEY_DB_VERSION,
  S_KEY_JWT_SECRET,
  __args,
  __package
} from './utils'
import { logger } from './log'
import { getCollections, getDBVersion } from './db'
import { shouldInit } from './mitigation'

async function main() {
  const db = await getDb()
  const { Metas } = getCollections(db)

  if (!__args.init && (await shouldInit(db))) {
    logger.error('DB not initialized')
    process.exit(1)
  }

  if (__args.init) {
    await DI.waitFor(K_APP_INIT)
  }

  await DI.waitFor(K_APP_MITIGATION)

  logger.info('Database initialized. Version: ' + (await getDBVersion(db)))

  if (__args.revokeJwtSecret) {
    logger.info('Revoking JWT Secret')
    const key = await randomBytesAsync(32).then((b) => b.toString('base64'))
    Metas.updateOne({ slug: S_KEY_JWT_SECRET }, { $set: { value: key } })
    logger.info('JWT Secret revoked')
  }

  await DI.waitFor(K_WEB)
  logger.error(`ZCMS version ${__package.version} started`)
}

main().catch(console.dir)
