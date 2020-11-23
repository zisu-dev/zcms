import pino from 'pino'
import { __args } from '../utils'

export const logger = pino({ prettyPrint: __args.dev })
