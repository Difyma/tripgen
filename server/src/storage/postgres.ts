import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPgPool(): Pool {
  if (pool) return pool;
  pool = new Pool({
    host: process.env.PGHOST,
    port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : undefined,
    max: 10,
  });
  return pool;
}
