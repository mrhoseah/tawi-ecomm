import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Ensures the Prisma connection is alive. Call before queries if you see
 * "Server has closed the connection" errors (common with Turbopack HMR).
 */
export async function ensurePrismaConnected() {
  try {
    await prisma.$connect();
  } catch {
    // Ignore - may already be connected
  }
}

