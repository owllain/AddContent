import { PrismaClient } from '@prisma/client'
import { createClient } from '@libsql/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const dbUrl = process.env.TURSO_DB_URL || process.env.DATABASE_URL
if (!dbUrl) {
  throw new Error("No se encontró la URL de la base de datos (TURSO_DB_URL o DATABASE_URL)")
}

const libsql = createClient({
  url: dbUrl,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

const adapter = new PrismaLibSql(libsql)

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db