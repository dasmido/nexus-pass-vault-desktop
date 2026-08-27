import type { PasswordEntry, PasswordEntryInput } from './database';

function parseCsvRows(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  const text = content.replace(/\r\n/g, '\n');

  while (i < text.length) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += char;
      i++;
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (char === ',') {
      row.push(field);
      field = '';
      i++;
      continue;
    }
    if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i++;
      continue;
    }
    field += char;
    i++;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((cells) => cells.some((cell) => cell.trim().length > 0));
}

/**
 * Parses CSV content into password entries. Recognises a `website,username,secret`
 * header (in any column order, `password` accepted as an alias for `secret`) and
 * falls back to positional columns when no header is present.
 */
export function parseCsvPasswordEntries(content: string): PasswordEntryInput[] {
  const rows = parseCsvRows(content);
  if (rows.length === 0) return [];

  const header = rows[0].map((cell) => cell.trim().toLowerCase());
  const hasHeader = header.includes('website') && header.includes('username');

  let websiteIdx = 0;
  let usernameIdx = 1;
  let secretIdx = 2;
  let dataRows = rows;

  if (hasHeader) {
    websiteIdx = header.indexOf('website');
    usernameIdx = header.indexOf('username');
    secretIdx = header.includes('secret') ? header.indexOf('secret') : header.indexOf('password');
    dataRows = rows.slice(1);
  }

  return dataRows
    .map((cells) => ({
      website: (cells[websiteIdx] ?? '').trim(),
      username: (cells[usernameIdx] ?? '').trim(),
      secret: (cells[secretIdx] ?? '').trim()
    }))
    .filter((entry) => entry.website && entry.username && entry.secret);
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toCsvPasswordEntries(entries: PasswordEntry[]): string {
  const lines = ['website,username,secret'];
  for (const entry of entries) {
    lines.push([entry.website, entry.username, entry.secret].map(csvEscape).join(','));
  }
  return lines.join('\n');
}
