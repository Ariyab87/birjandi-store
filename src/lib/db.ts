import postgres from 'postgres';
import { randomBytes } from 'crypto';

// One client per server instance. `prepare: false` keeps it compatible with
// pooled (pgbouncer) connection strings such as Neon's.
const globalForDb = globalThis as unknown as { sql?: postgres.Sql };

export const sql =
  globalForDb.sql ??
  postgres(process.env.DATABASE_URL || 'postgres://localhost/kalaland', {
    prepare: false,
    max: 5,
    idle_timeout: 20,
    // Return NUMERIC columns as JS numbers (prices are small enough).
    types: { numeric: { to: 1700, from: [1700], serialize: String, parse: Number } },
  });

if (process.env.NODE_ENV !== 'production') globalForDb.sql = sql;

/** Random 24-char id in the same style as the Strapi documentIds we kept. */
export function newDocumentId(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(randomBytes(24), b => alphabet[b % alphabet.length]).join('');
}

export const ADMIN_PASSWORD = process.env.ADMIN_CHAT_PASSWORD || '';

/** Constant-ish check; also refuses everything when no password is configured. */
export function isAdmin(password: unknown): boolean {
  return !!ADMIN_PASSWORD && password === ADMIN_PASSWORD;
}
