import { PrismaClient } from './generated/client/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Database file is in the same directory as this file (packages/db/index.ts)
// during development, but Prisma Client might be running from elsewhere.
// Assuming dev.db is in packages/db/dev.db
const dbPath = path.resolve(__dirname, 'dev.db')

const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` })

export const prisma = new PrismaClient({ adapter })

export * from './generated/client/client'
