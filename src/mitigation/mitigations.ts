import { defineMitigation } from './mitigation_base'

defineMitigation('0.0.0', async ({ logger }) => {
  logger.info('Nothing to mitigate')
})

defineMitigation('0.0.1', async ({ cols }) => {
  const { Tags } = cols
  await Tags.updateMany({}, { $set: { content: '' } })
})

defineMitigation('0.0.2', async ({ client, db, logger, cols }) => {
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
