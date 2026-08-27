import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { getDatabaseClient } from './database';

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number
) => Promise<Buffer>;

const KEY_LENGTH = 64;
const MIN_PASSCODE_LENGTH = 4;
const LOCK_ROW_ID = 1;

let unlocked = false;

async function derive(passcode: string, salt: Buffer): Promise<Buffer> {
  return scryptAsync(passcode.normalize('NFKC'), salt, KEY_LENGTH);
}

export async function isPasscodeConfigured(): Promise<boolean> {
  const result = await getDatabaseClient().query<{ exists: boolean }>(
    'SELECT EXISTS (SELECT 1 FROM app_lock WHERE id = $1) AS exists',
    [LOCK_ROW_ID]
  );
  return Boolean(result.rows[0]?.exists);
}

export async function setupPasscode(passcode: string): Promise<void> {
  if (await isPasscodeConfigured()) {
    throw new Error('A passcode has already been set up.');
  }
  if (typeof passcode !== 'string' || passcode.length < MIN_PASSCODE_LENGTH) {
    throw new Error(`Passcode must be at least ${MIN_PASSCODE_LENGTH} characters.`);
  }

  const salt = randomBytes(16);
  const hash = await derive(passcode, salt);
  await getDatabaseClient().query(
    `INSERT INTO app_lock (id, salt, hash) VALUES ($1, $2, $3)`,
    [LOCK_ROW_ID, salt.toString('hex'), hash.toString('hex')]
  );
  unlocked = true;
}

export async function verifyPasscode(passcode: string): Promise<boolean> {
  if (typeof passcode !== 'string' || !passcode) return false;

  const result = await getDatabaseClient().query<{ salt: string; hash: string }>(
    'SELECT salt, hash FROM app_lock WHERE id = $1',
    [LOCK_ROW_ID]
  );
  const row = result.rows[0];
  if (!row) return false;

  const expected = Buffer.from(row.hash, 'hex');
  const actual = await derive(passcode, Buffer.from(row.salt, 'hex'));
  const matches = expected.length === actual.length && timingSafeEqual(expected, actual);
  if (matches) unlocked = true;
  return matches;
}

export async function changePasscode(current: string, next: string): Promise<void> {
  if (!(await verifyPasscode(current))) {
    throw new Error('Current passcode is incorrect.');
  }
  if (typeof next !== 'string' || next.length < MIN_PASSCODE_LENGTH) {
    throw new Error(`Passcode must be at least ${MIN_PASSCODE_LENGTH} characters.`);
  }

  const salt = randomBytes(16);
  const hash = await derive(next, salt);
  await getDatabaseClient().query('UPDATE app_lock SET salt = $2, hash = $3 WHERE id = $1', [
    LOCK_ROW_ID,
    salt.toString('hex'),
    hash.toString('hex')
  ]);
}

export function lock(): void {
  unlocked = false;
}

export function isUnlocked(): boolean {
  return unlocked;
}

/** Wraps an IPC handler so vault data is only reachable after the passcode is accepted. */
export function requireUnlocked<Args extends unknown[], Result>(
  handler: (...args: Args) => Result | Promise<Result>
) {
  return async (...args: Args): Promise<Result> => {
    if (!unlocked) {
      throw new Error('Vault is locked.');
    }
    return handler(...args);
  };
}
