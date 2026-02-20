// Prisma has been removed from this package.
// The project currently uses direct `pg` queries in the backend.
// Keep a minimal stub export so any incidental imports won't break.

export const prisma = null as unknown as never;

export async function connectDb(): Promise<void> {
  throw new Error('Prisma client removed from @webet/database. Use direct pg pool from @webet/backend or packages/backend/src/lib/db.ts');
}

export async function disconnectDb(): Promise<void> {
  return;
}

export async function withTransaction<T>(_fn: (tx: unknown) => Promise<T>): Promise<T> {
  throw new Error('Prisma client removed from @webet/database. Transaction helper unavailable.');
}

export default prisma;