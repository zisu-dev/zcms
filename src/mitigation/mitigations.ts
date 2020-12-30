import { Binary } from 'mongodb'
import { defineMitigation } from './mitigation_base'

defineMitigation('0.0.0', async ({ logger }) => {
  logger.info('Nothing to mitigate')
})

defineMitigation('0.0.1', async ({ cols }) => {
  const { Tags } = cols
  await Tags.updateMany({}, { $set: { content: '' } })
})

defineMitigation('0.0.2', async ({ db, logger, cols }) => {
  const collections = await db.listCollections().toArray()
  for (const collection of collections) {
    logger.info('Drop indexes for ' + collection.name)
    await db.command({ dropIndexes: collection.name, index: '*' })
  }
  const { Users, Posts, Tags } = cols
  await Users.createIndex('slug', { unique: true, name: 'slug' })
  await Users.createIndex('email', { unique: true, name: 'email' })
  await Posts.createIndex('slug', { unique: true, name: 'slug' })
  await Tags.createIndex('slug', { unique: true, name: 'slug' })
})

defineMitigation('0.0.3', async ({ cols: { Metas } }) => {
  await Metas.createIndex('slug', { unique: true, name: 'slug' })
})

defineMitigation('0.0.4', async ({ cols: { Users, Metas } }) => {
  await Metas.updateMany({}, { $set: { public: false } })

  const users = await Users.find().toArray()
  for (const user of users) {
    // @ts-expect-error
    const hash: string = user.pass.hash
    // @ts-expect-error
    const salt: string = user.pass.salt
    const pass = {
      hash: new Binary(Buffer.from(hash, 'hex')),
      salt: new Binary(Buffer.from(salt, 'hex'))
    }
    await Users.updateOne({ _id: user._id }, { $set: { pass } })
  }
})

defineMitigation('0.0.5', async ({ cols: { Metas, Users } }) => {
  await Metas.insertOne({ slug: '$oauth_config', value: {}, public: false })
  await Users.updateMany({}, { $set: { oauth: {} } })
  await Users.createIndex('oauth.github', { unique: true, sparse: true })
})

defineMitigation('0.0.6', async ({ cols: { Posts }, logger }) => {
  const posts = await Posts.find({}, { projection: { published: 1 } }).toArray()
  logger.info(`Updating ${posts.length} posts`)
  for (const post of posts) {
    await Posts.updateOne(
      { _id: post._id },
      { $set: { updated: post.published } }
    )
  }
  await Posts.createIndex({ updated: -1 }, { name: 'updated' })
  logger.info('Done')
})
