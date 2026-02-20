import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';

// Re-export all generated types so consumers can import them from @webet/database
export * from './generated/prisma/client';

// ---------------------------------------------------------------------------
// Singleton PrismaClient (Prisma v7 — driver-adapter based)
// ---------------------------------------------------------------------------

const DATABASE_URL = process.env['DATABASE_URL'];

function createPrismaClient(): PrismaClient {
  if (!DATABASE_URL) {
    throw new Error(
      'DATABASE_URL environment variable is not set. ' +
      'Make sure it is defined before importing @webet/database.',
    );
  }

  const adapter = new PrismaPg({ connectionString: DATABASE_URL });

  return new PrismaClient({
    adapter,
    log: [
      { level: 'error', emit: 'stdout' },
      { level: 'warn', emit: 'stdout' },
    ],
  });
}

// Global singleton — avoids creating multiple clients in dev (hot-reload)
const globalForPrisma = globalThis as unknown as { __prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.__prisma ?? createPrismaClient();

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.__prisma = prisma;
}

// ---------------------------------------------------------------------------
// Convenience helpers
// ---------------------------------------------------------------------------

/** Explicitly connect to the database (optional — Prisma connects lazily). */
export async function connectDb(): Promise<void> {
  await prisma.$connect();
}

/** Disconnect from the database. Call on graceful shutdown. */
export async function disconnectDb(): Promise<void> {
  await prisma.$disconnect();
}

/**
 * Run a callback inside an interactive transaction.
 * The transaction is committed when the callback resolves, rolled back on throw.
 */
export async function withTransaction<T>(
  fn: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(fn);
}

export default prisma;
