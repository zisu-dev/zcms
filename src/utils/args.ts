import yargs from 'yargs'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config()

export const __args = yargs
  .env('ZCMS')
  .config()
  .option('init', { default: false })
  .option('revokeJwtSecret', { default: false })
  .option('dev', { default: false })
  .option('dbUrl', { type: 'string', default: 'mongodb://localhost:27017' })
  .option('staticPath', {
    type: 'string',
    default: path.resolve(__dirname, '..', '..', 'static')
  })
  .option('origin', { type: 'string', default: '*' }).argv
