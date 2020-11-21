import * as yargs from 'yargs'

export const __args = yargs
  .option('init', { type: 'boolean', default: false })
  .options('verbose', { type: 'boolean', default: false }).argv
