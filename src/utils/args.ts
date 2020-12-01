import * as yargs from 'yargs'

export const __args = yargs
  .option('init', { type: 'boolean', default: false })
  .option('revokeJwtSecret', { type: 'boolean', default: false })
  .option('dev', { type: 'boolean', default: false }).argv
