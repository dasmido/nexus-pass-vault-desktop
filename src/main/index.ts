import { app, BrowserWindow, Menu, ipcMain, shell, dialog } from 'electron';
import { execFile } from 'child_process';
import path from 'path';
import {
  createPasswordEntry,
  deletePasswordEntry,
  getLastActivity,
  listPasswordEntries,
  startDatabase,
  stopDatabase,
  updatePasswordEntry
} from './database';
import {
  changePasscode,
  isPasscodeConfigured,
  isUnlocked,
  lock,
  requireUnlocked,
  setupPasscode,
  verifyPasscode
} from './auth';

const isDev = Boolean(process.env.ELECTRON_RENDERER_URL);

let mainWindow: BrowserWindow | null = null;

ipcMain.handle(
  'passwords:list',
  requireUnlocked((_event, page?: number, pageSize?: number) => listPasswordEntries(page, pageSize))
);
ipcMain.handle(
  'passwords:create',
  requireUnlocked((_event, input) => createPasswordEntry(input))
);
ipcMain.handle(
  'passwords:update',
  requireUnlocked((_event, id: string, input) => updatePasswordEntry(id, input))
);
ipcMain.handle(
  'passwords:delete',
  requireUnlocked((_event, id: string) => deletePasswordEntry(id))
);
ipcMain.handle(
  'passwords:lastActivity',
  requireUnlocked(() => getLastActivity())
);

ipcMain.handle('auth:status', async () => ({
  configured: await isPasscodeConfigured(),
  unlocked: isUnlocked()
}));
ipcMain.handle('auth:setup', (_event, passcode: string) => setupPasscode(passcode));
ipcMain.handle('auth:unlock', (_event, passcode: string) => verifyPasscode(passcode));
ipcMain.handle('auth:verify', (_event, passcode: string) => verifyPasscode(passcode));
ipcMain.handle(
  'auth:changePasscode',
  requireUnlocked((_event, current: string, next: string) => changePasscode(current, next))
);
ipcMain.handle('auth:lock', () => lock());

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    },
    icon: isDev ? undefined : path.join(__dirname, '../../assets/icon.png')
  });

  // Remove menu bar in production
  if (!isDev) {
    Menu.setApplicationMenu(null);
  }

  // Load app
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    openInBrowser(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('preload-error', (_event, preloadPath, error) => {
    console.error(`Failed to load preload script ${preloadPath}:`, error);
  });

  if (isDev) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL!);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
    lock();
  });
}

function openInBrowser(url: string) {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') return;

    if (process.platform === 'darwin') {
      execFile('open', ['-a', 'Google Chrome', parsedUrl.toString()]);
    } else {
      void shell.openExternal(parsedUrl.toString());
    }
  } catch (error) {
    console.error('Failed to open external URL:', error);
  }
}

// App event handlers
app.on('ready', async () => {
  try {
    await startDatabase();
  } catch (error) {
    console.error('Failed to start embedded Postgres:', error);
    dialog.showErrorBox(
      'Database failed to start',
      error instanceof Error ? error.message : String(error)
    );
  }
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', async () => {
  await stopDatabase();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  if (!isDev) {
    app.quit();
  }
});