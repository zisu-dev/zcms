import { readFileSync } from 'fs'
import path from 'path'

const PACKAGE_JSON_PATH = path.join(__dirname, '..', '..', 'package.json')
export const __package = JSON.parse(readFileSync(PACKAGE_JSON_PATH).toString())
