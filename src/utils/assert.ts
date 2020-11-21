import { S_NOTFOUND } from './strings'

export function notNull<T>(x: T | null): asserts x is T {
  if (x === null) throw new Error(S_NOTFOUND)
}
