import path from 'path';
import { existsSync, readFileSync } from 'fs';
import { randomUUID } from 'crypto';
import { app } from 'electron';
import EmbeddedPostgres from 'embedded-postgres';
import { Client } from 'pg';

const DATABASE_NAME = 'nexus_vault';
const DATABASE_PORT = 55432;

export interface PasswordEntry {
  id: string;
  website: string;
  username: string;
  secret: string;
}

export type PasswordEntryInput = Omit<PasswordEntry, 'id'>;

export interface PasswordEntryPage {
  entries: PasswordEntry[];
  totalItems: number;
}

let postgres: EmbeddedPostgres | null = null;
let client: Client | null = null;
let ownsPostgresProcess = false;

function resolveDataDir(): string {
  return path.join(app.getPath('userData'), 'postgres-data');
}

function isPostgresAlreadyRunning(databaseDir: string): boolean {
  const lockFile = path.join(databaseDir, 'postmaster.pid');
  if (!existsSync(lockFile)) return false;

  try {
    const pid = Number(readFileSync(lockFile, 'utf8').split('\n')[0]);
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Starts (initialising on first run) the embedded Postgres cluster and
 * returns a connected client for the vault's database.
 */
export async function startDatabase(): Promise<Client> {
  const databaseDir = resolveDataDir();
  const alreadyInitialised = existsSync(path.join(databaseDir, 'PG_VERSION'));

  postgres = new EmbeddedPostgres({
    databaseDir,
    port: DATABASE_PORT,
    user: 'postgres',
    // Bound to localhost only, so a fixed local password is acceptable here.
    password: 'nexus-pass-vault-local',
    persistent: true
  });

  if (!alreadyInitialised) {
    await postgres.initialise();
  }

  try {
    await postgres.start();
    ownsPostgresProcess = true;
  } catch (error) {
    const message = String(error);
    if (!/postmaster\.pid|already running|lock file/.test(message) && !isPostgresAlreadyRunning(databaseDir)) {
      throw error;
    }
  }

  if (ownsPostgresProcess) {
    try {
      await postgres.createDatabase(DATABASE_NAME);
    } catch (error) {
      // Ignore "database already exists" so startup stays idempotent
      const isDuplicate = error instanceof Error && /already exists/.test(error.message);
      if (!isDuplicate) {
        throw error;
      }
    }
    client = postgres.getPgClient(DATABASE_NAME);
  } else {
    client = new Client({
      host: '127.0.0.1',
      port: DATABASE_PORT,
      user: 'postgres',
      password: 'nexus-pass-vault-local',
      database: DATABASE_NAME
    });
  }

  await client.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS password_entries (
      id TEXT PRIMARY KEY,
      website TEXT NOT NULL,
      username TEXT NOT NULL,
      secret TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  return client;
}

export function getDatabaseClient(): Client {
  if (!client) {
    throw new Error('Database has not been started yet.');
  }
  return client;
}

export async function listPasswordEntries(page = 1, pageSize = 10): Promise<PasswordEntryPage> {
  const safePage = Math.max(1, Math.floor(page));
  const safePageSize = Math.min(100, Math.max(1, Math.floor(pageSize)));
  const offset = (safePage - 1) * safePageSize;
  const database = getDatabaseClient();
  const [entries, count] = await Promise.all([
    database.query<PasswordEntry>(
      `SELECT id, website, username, secret
       FROM password_entries
       ORDER BY website ASC, id ASC
       LIMIT $1 OFFSET $2`,
      [safePageSize, offset]
    ),
    database.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM password_entries')
  ]);
  return {
    entries: entries.rows,
    totalItems: Number(count.rows[0]?.count ?? 0)
  };
}

export async function createPasswordEntry(input: PasswordEntryInput): Promise<PasswordEntry> {
  const result = await getDatabaseClient().query<PasswordEntry>(
    `INSERT INTO password_entries (id, website, username, secret)
     VALUES ($1, $2, $3, $4)
     RETURNING id, website, username, secret`,
    [randomUUID(), input.website, input.username, input.secret]
  );
  return result.rows[0];
}

export async function updatePasswordEntry(
  id: string,
  input: PasswordEntryInput
): Promise<PasswordEntry> {
  const result = await getDatabaseClient().query<PasswordEntry>(
    `UPDATE password_entries
     SET website = $2, username = $3, secret = $4, updated_at = NOW()
     WHERE id = $1
     RETURNING id, website, username, secret`,
    [id, input.website, input.username, input.secret]
  );
  if (!result.rows[0]) throw new Error('Password entry not found.');
  return result.rows[0];
}

export async function deletePasswordEntry(id: string): Promise<void> {
  await getDatabaseClient().query('DELETE FROM password_entries WHERE id = $1', [id]);
}

export async function getLastActivity(): Promise<string | null> {
  const result = await getDatabaseClient().query<{ last_activity: string | null }>(
    'SELECT MAX(updated_at)::text AS last_activity FROM password_entries'
  );
  return result.rows[0]?.last_activity ?? null;
}

export async function stopDatabase(): Promise<void> {
  await client?.end();
  client = null;
  if (ownsPostgresProcess) {
    await postgres?.stop();
  }
  postgres = null;
  ownsPostgresProcess = false;
}
