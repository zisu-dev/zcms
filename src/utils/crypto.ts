import nodeUtil from 'util'
import crypto from 'crypto'
import { IUserPass } from '../db'

export const randomBytesAsync = nodeUtil.promisify(crypto.randomBytes)
export const pbkdf2Async = nodeUtil.promisify(crypto.pbkdf2)

export async function generatePasswordPair(pwd: string): Promise<IUserPass> {
  const salt = await randomBytesAsync(16).then((b) => b.toString('hex'))
  const hash = await pbkdf2Async(pwd, salt, 1000, 16, 'sha512').then((b) =>
    b.toString('hex')
  )
  return { hash, salt }
}

export async function verifyPassword(
  pwd: string,
  pair: IUserPass
): Promise<boolean> {
  const hash = await pbkdf2Async(pwd, pair.salt, 1000, 16, 'sha512').then((b) =>
    b.toString('hex')
  )
  return hash === pair.hash
}
