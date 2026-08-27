import { contextBridge, ipcRenderer } from 'electron';

type PasswordEntryInput = {
  website: string;
  username: string;
  secret: string;
};

contextBridge.exposeInMainWorld('api', {
  nodeVersion: process.versions.node,
  auth: {
    status: () => ipcRenderer.invoke('auth:status'),
    setup: (passcode: string) => ipcRenderer.invoke('auth:setup', passcode),
    unlock: (passcode: string) => ipcRenderer.invoke('auth:unlock', passcode),
    verify: (passcode: string) => ipcRenderer.invoke('auth:verify', passcode),
    lock: () => ipcRenderer.invoke('auth:lock')
  },
  passwords: {
    list: (page?: number, pageSize?: number) => ipcRenderer.invoke('passwords:list', page, pageSize),
    create: (input: PasswordEntryInput) => ipcRenderer.invoke('passwords:create', input),
    update: (id: string, input: PasswordEntryInput) =>
      ipcRenderer.invoke('passwords:update', id, input),
    delete: (id: string) => ipcRenderer.invoke('passwords:delete', id),
    lastActivity: () => ipcRenderer.invoke('passwords:lastActivity')
  }
});