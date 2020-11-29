import pino from 'pino'
import { __args } from '../utils'

export const logger = pino({
  prettyPrint: __args.dev,
  level: __args.dev ? 'info' : 'error'
})
