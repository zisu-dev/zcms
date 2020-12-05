export function isObjectId(s: string) {
  return /[a-z0-9]{24}/.test(s)
}
