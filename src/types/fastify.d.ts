/* eslint-disable */
import fastify from 'fastify'
import { IUserDoc } from '../db'

declare module 'fastify' {
  interface FastifyInstance {
    'auth:login': preValidationHookHandler
    'auth:admin': preValidationHookHandler
  }

  interface FastifyRequest {
    'ctx:user': IUserDoc
  }
}
