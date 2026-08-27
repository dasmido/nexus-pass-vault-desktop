import { app, BrowserWindow, Menu, ipcMain, shell } from 'electron';
import { execFile } from 'child_process';
import path from 'path';
import {
  createPasswordEntry,
  deletePasswordEntry,
  listPasswordEntries,
  startDatabase,
  stopDatabase,
  updatePasswordEntry
} from './database';

const isDev = Boolean(process.env.ELECTRON_RENDERER_URL);

let mainWindow: BrowserWindow | null = null;

ipcMain.handle('passwords:list', () => listPasswordEntries());
ipcMain.handle('passwords:create', (_event, input) => createPasswordEntry(input));
ipcMain.handle('passwords:update', (_event, id: string, input) => updatePasswordEntry(id, input));
ipcMain.handle('passwords:delete', (_event, id: string) => deletePasswordEntry(id));

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