import { getCollections } from '../db'
import { logger } from '../log'
import {
  DI,
  generatePasswordPair,
  getDb,
  K_APP_INIT,
  randomBytesAsync,
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
  const { Metas, Users, Posts, Tags } = getCollections(db)
  const jwtSecret = await randomBytesAsync(32).then((b) => b.toString('base64'))
  await Metas.createIndex('slug', { unique: true, name: 'slug' })
  await Metas.insertMany([
    { slug: S_KEY_DB_VERSION, value: '0.0.4', public: false },
    { slug: S_KEY_JWT_SECRET, value: jwtSecret, public: false }
  ])

  await Users.createIndex('slug', { unique: true, name: 'slug' })
  await Users.createIndex('email', { unique: true, name: 'email' })

  const r = await Users.insertOne({
    slug: DEFAULT_ADMIN_NAME,
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

  await Posts.createIndex('slug', { unique: true, name: 'slug' })

  await Tags.createIndex('slug', { unique: true, name: 'slug' })
  logger.info('Initialize done')
})
