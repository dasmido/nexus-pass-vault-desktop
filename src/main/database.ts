import path from 'path';
import { existsSync } from 'fs';
import { app } from 'electron';
import EmbeddedPostgres from 'embedded-postgres';
import { Client } from 'pg';

const DATABASE_NAME = 'nexus_vault';
const DATABASE_PORT = 55432;

let postgres: EmbeddedPostgres | null = null;
let client: Client | null = null;

function resolveDataDir(): string {
  return path.join(app.getPath('userData'), 'postgres-data');
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

  await postgres.start();

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
  await client.connect();
  return client;
}

export function getDatabaseClient(): Client {
  if (!client) {
    throw new Error('Database has not been started yet.');
  }
  return client;
}

export async function stopDatabase(): Promise<void> {
  await client?.end();
  client = null;
  await postgres?.stop();
  postgres = null;
}
