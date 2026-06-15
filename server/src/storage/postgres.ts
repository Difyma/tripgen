import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPgPool(): Pool {
  if (pool) return pool;
  pool = process.env.DATABASE_URL
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : undefined,
        max: 10,
      })
    : new Pool({
        host: process.env.PGHOST,
        port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
        ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : undefined,
        max: 10,
      });
  pool.on('error', (err) => {
    console.error('[postgres] idle client error:', err.message);
  });
  return pool;
}

export function hasPgConnectionConfig(): boolean {
  return Boolean(
    process.env.DATABASE_URL ||
      (process.env.PGDATABASE && process.env.PGHOST && process.env.PGUSER)
  );
}
