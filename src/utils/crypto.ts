import nodeUtil from 'util'
import crypto from 'crypto'
import { IUserPass } from '../db'
import { Binary } from 'mongodb'

export const randomBytesAsync = nodeUtil.promisify(crypto.randomBytes)
export const pbkdf2Async = nodeUtil.promisify(crypto.pbkdf2)

export async function generatePasswordPair(pwd: string): Promise<IUserPass> {
  const salt = await randomBytesAsync(16)
  const hash = await pbkdf2Async(pwd, salt, 1000, 16, 'sha512')
  return {
    hash: new Binary(hash),
    salt: new Binary(salt)
  }
}

export async function verifyPassword(
  pwd: string,
  pair: IUserPass
): Promise<boolean> {
  const hash = await pbkdf2Async(pwd, pair.salt.buffer, 1000, 16, 'sha512')
  return hash.equals(pair.hash.buffer)
}
