import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import dotenv from 'dotenv';

// Load env vars if not already loaded
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set in environment');
  // Don't throw immediately - let it fail at runtime when actually connecting
}

export const pool = new Pool({ 
  connectionString,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Database connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
});

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('✅ Database connection test passed');
    return true;
  } catch (err) {
    console.error('❌ Database connection test failed:', err);
    throw err;
  }
}

// Simple query helper
export async function query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
  const start = Date.now();
  const res = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  if (duration > 200) {
    console.warn('Slow query', { text: text.substring(0, 100), duration });
  }
  return res;
}

// Get single row or null
export async function queryOne<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<T | null> {
  const res = await query<T>(text, params);
  return res.rows[0] || null;
}

// Get all rows
export async function queryAll<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<T[]> {
  const res = await query<T>(text, params);
  return res.rows;
}

// Transaction helper
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// Helper to build WHERE clauses dynamically
export function buildWhereClause(
  conditions: Record<string, any>,
  startIndex: number = 1
): { clause: string; values: any[] } {
  const entries = Object.entries(conditions).filter(([_, v]) => v !== undefined);
  if (entries.length === 0) {
    return { clause: '', values: [] };
  }
  
  const clauses: string[] = [];
  const values: any[] = [];
  
  entries.forEach(([key, value], i) => {
    // Convert camelCase to snake_case
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    clauses.push(`${snakeKey} = $${startIndex + i}`);
    values.push(value);
  });
  
  return {
    clause: 'WHERE ' + clauses.join(' AND '),
    values,
  };
}

// Helper for INSERT statements
export async function insert<T extends QueryResultRow = any>(
  table: string,
  data: Record<string, any>,
  returning: string = '*'
): Promise<T> {
  const entries = Object.entries(data).filter(([_, v]) => v !== undefined);
  const columns = entries.map(([k]) => k.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`));
  const placeholders = entries.map((_, i) => `$${i + 1}`);
  const values = entries.map(([_, v]) => v);
  
  const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING ${returning}`;
  const res = await query<T>(sql, values);
  return res.rows[0];
}

// Helper for UPDATE statements
export async function update<T extends QueryResultRow = any>(
  table: string,
  data: Record<string, any>,
  where: Record<string, any>,
  returning: string = '*'
): Promise<T | null> {
  const dataEntries = Object.entries(data).filter(([_, v]) => v !== undefined);
  const whereEntries = Object.entries(where).filter(([_, v]) => v !== undefined);
  
  if (dataEntries.length === 0) return null;
  
  const setClauses = dataEntries.map(([k], i) => {
    const snakeKey = k.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`);
    return `${snakeKey} = $${i + 1}`;
  });
  
  const whereClauses = whereEntries.map(([k], i) => {
    const snakeKey = k.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`);
    return `${snakeKey} = $${dataEntries.length + i + 1}`;
  });
  
  const values = [...dataEntries.map(([_, v]) => v), ...whereEntries.map(([_, v]) => v)];
  
  const sql = `UPDATE ${table} SET ${setClauses.join(', ')} WHERE ${whereClauses.join(' AND ')} RETURNING ${returning}`;
  const res = await query<T>(sql, values);
  return res.rows[0] || null;
}

export default pool;
