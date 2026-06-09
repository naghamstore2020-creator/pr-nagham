import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.warn('DATABASE_URL not set, DB operations will fail gracefully')
    return null as unknown as PrismaClient
  }
  if (connectionString.startsWith('file:')) {
    try {
      const { PrismaLibSql } = require('@prisma/adapter-libsql')
      const adapter = new PrismaLibSql({ url: connectionString })
      return new (PrismaClient as any)({ adapter }) as PrismaClient
    } catch (e) {
      console.warn('Failed to initialize Prisma with libsql adapter:', e)
      return null as unknown as PrismaClient
    }
  }
  try {
    const { PrismaPg } = require('@prisma/adapter-pg')
    const adapter = new PrismaPg({ connectionString })
    return new (PrismaClient as any)({ adapter }) as PrismaClient
  } catch (e) {
    console.warn('Failed to initialize Prisma with adapter, DB will be unavailable:', e)
    return null as unknown as PrismaClient
  }
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
