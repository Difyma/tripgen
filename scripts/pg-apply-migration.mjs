#!/usr/bin/env node
/**
 * Применить SQL-миграцию через DATABASE_URL или PG* переменные.
 * Пример: DATABASE_URL=... node scripts/pg-apply-migration.mjs db/migrations/002_etg_hotel_content_room_groups.sql
 */
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const sqlPath = process.argv[2] || path.join(repoRoot, 'db/migrations/002_etg_hotel_content_room_groups.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

let connectionString = process.env.DATABASE_URL;
if (!connectionString && process.env.PGDATABASE && process.env.PGHOST) {
  const u = process.env.PGUSER || 'postgres';
  const p = process.env.PGPASSWORD ? encodeURIComponent(process.env.PGPASSWORD) : '';
  const h = process.env.PGHOST;
  const port = process.env.PGPORT || '5432';
  const d = process.env.PGDATABASE;
  connectionString = p ? `postgresql://${u}:${p}@${h}:${port}/${d}` : `postgresql://${u}@${h}:${port}/${d}`;
}

if (!connectionString) {
  console.error('Set DATABASE_URL or PGHOST+PGDATABASE+PGUSER (and PGPASSWORD if needed).');
  process.exit(1);
}

const client = new pg.Client({ connectionString, ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : undefined });
await client.connect();
try {
  await client.query(sql);
  console.log('Migration applied:', path.relative(repoRoot, sqlPath));
} finally {
  await client.end();
}
