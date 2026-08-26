import { app, BrowserWindow, Menu } from 'electron';
import path from 'path';
import { startDatabase, stopDatabase } from './database';

const isDev = Boolean(process.env.ELECTRON_RENDERER_URL);

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.mjs'),
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: isDev ? undefined : path.join(__dirname, '../../assets/icon.png')
  });

  // Remove menu bar in production
  if (!isDev) {
    Menu.setApplicationMenu(null);
  }

  // Load app
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