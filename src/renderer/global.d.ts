interface PasswordEntry {
  id: string;
  website: string;
  username: string;
  secret: string;
}

type PasswordEntryInput = Omit<PasswordEntry, 'id'>;

interface PasswordEntryPage {
  entries: PasswordEntry[];
  totalItems: number;
}

interface CsvExportResult {
  canceled: boolean;
  filePath?: string;
  count?: number;
}

interface CsvImportResult {
  canceled: boolean;
  imported?: number;
  total?: number;
}

declare interface Window {
  api: {
    auth: {
      status: () => Promise<{ configured: boolean; unlocked: boolean }>;
      setup: (passcode: string) => Promise<void>;
      unlock: (passcode: string) => Promise<boolean>;
      verify: (passcode: string) => Promise<boolean>;
      changePasscode: (current: string, next: string) => Promise<void>;
      lock: () => Promise<void>;
    };
    passwords: {
      list: (page?: number, pageSize?: number) => Promise<PasswordEntryPage>;
      create: (input: PasswordEntryInput) => Promise<PasswordEntry>;
      update: (id: string, input: PasswordEntryInput) => Promise<PasswordEntry>;
      delete: (id: string) => Promise<void>;
      lastActivity: () => Promise<string | null>;
      exportCsv: () => Promise<CsvExportResult>;
      importCsv: () => Promise<CsvImportResult>;
    };
  };
}
