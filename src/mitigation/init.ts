import { IMetaDoc, IPostDoc, ITagDoc, IUserDoc } from '../db'
import { logger } from '../log'
import {
  DI,
  generatePasswordPair,
  getDb,
  K_APP_INIT,
  randomBytesAsync,
  S_COL_META,
  S_COL_POST,
  S_COL_TAG,
  S_COL_USER,
  S_KEY_DB_VERSION,
  S_KEY_JWT_SECRET,
  __package
} from '../utils'

const DEFAULT_ADMIN_NAME = 'admin'
const DEFAULT_ADMIN_PASS = 'adminadmin'
const DEFAULT_ADMIN_EMAIL = 'i@zzs1.cn'

DI.step(K_APP_INIT, async () => {
  logger.info('Initialize DB')
  const db = await getDb()

  const collections = await db.collections()
  for (const collection of collections) {
    await collection.drop()
  }

  logger.info('DB is clear')
  const Metas = db.collection<IMetaDoc>(S_COL_META)
  await Metas.insertMany([
    {
      _id: S_KEY_DB_VERSION,
      value: __package.version
    },
    {
      _id: S_KEY_JWT_SECRET,
      value: await randomBytesAsync(32).then((b) => b.toString('base64'))
    }
  ])

  const Users = db.collection<IUserDoc>(S_COL_USER)
  await Users.createIndex('login', { unique: true })
  await Users.createIndex('email', { unique: true })

  const r = await Users.insertOne({
    login: DEFAULT_ADMIN_NAME,
    name: DEFAULT_ADMIN_NAME,
    email: DEFAULT_ADMIN_EMAIL,
    pass: await generatePasswordPair(DEFAULT_ADMIN_PASS),
    perm: {
      admin: true
    }
  })
  logger.info(
    `Created admin user [${r.insertedId}] name=${DEFAULT_ADMIN_NAME} pass=${DEFAULT_ADMIN_PASS}`
  )

  const Posts = db.collection<IPostDoc>(S_COL_POST)
  await Posts.createIndex('slug', { unique: true })

  const Tags = db.collection<ITagDoc>(S_COL_TAG)
  await Tags.createIndex('slug', { unique: true })
  logger.info('Initialize done')
})
