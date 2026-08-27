interface PasswordEntry {
  id: string;
  website: string;
  username: string;
  secret: string;
}

type PasswordEntryInput = Omit<PasswordEntry, 'id'>;

declare interface Window {
  api: {
    passwords: {
      list: () => Promise<PasswordEntry[]>;
      create: (input: PasswordEntryInput) => Promise<PasswordEntry>;
      update: (id: string, input: PasswordEntryInput) => Promise<PasswordEntry>;
      delete: (id: string) => Promise<void>;
    };
  };
}
