import { Pool, PoolClient } from 'pg';
import { env } from './env';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export async function testDatabaseConnection(): Promise<boolean> {
  try {
    let client: PoolClient | undefined;
    try {
      client = await pool.connect();
      await client.query('SELECT NOW()');
      console.log('✅ Database connected successfully');
      return true;
    } finally {
      if (client) client.release();
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

export async function closeDatabaseConnection(): Promise<void> {
  await pool.end();
  console.log('Database connection closed');
}