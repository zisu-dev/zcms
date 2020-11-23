import './db'
import './web'
import './mitigation'

import {
  DI,
  getDb,
  K_APP_INIT,
  K_APP_MITIGATION,
  K_WEB,
  S_KEY_DB_VERSION,
  __args,
  __package
} from './utils'
import { logger } from './log'
import { getCollections, IMetaDoc } from './db'

async function main() {
  const db = await getDb()
  const { Metas } = getCollections(db)

  if (__args.init || !(await Metas.findOne({ _id: S_KEY_DB_VERSION }))) {
    await DI.waitFor(K_APP_INIT)
  } else {
    await DI.waitFor(K_APP_MITIGATION)
  }

  logger.info(
    'Database initialized. Version: ' +
      (await Metas.findOne({ _id: S_KEY_DB_VERSION }))?.value
  )

  await DI.waitFor(K_WEB)
  logger.error(`ZCMS version ${__package.version} started`)
}

main().catch(console.dir)
