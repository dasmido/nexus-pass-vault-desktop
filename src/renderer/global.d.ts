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

declare interface Window {
  api: {
    passwords: {
      list: (page?: number, pageSize?: number) => Promise<PasswordEntryPage>;
      create: (input: PasswordEntryInput) => Promise<PasswordEntry>;
      update: (id: string, input: PasswordEntryInput) => Promise<PasswordEntry>;
      delete: (id: string) => Promise<void>;
    };
  };
}
