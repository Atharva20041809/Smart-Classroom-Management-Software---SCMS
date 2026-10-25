const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Attempt to load .env from project root or user's current directory
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const groqService = require('./groqService');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1160,
    height: 760,
    minWidth: 960,
    minHeight: 620,
    title: 'Smart Classroom Management Software (SCMS)',
    backgroundColor: '#f8fafc',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  // Check if we are running in development mode
  const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production' && !process.argv.includes('--production');

  if (isDev) {
    const devUrl = 'http://localhost:5173';
    mainWindow.loadURL(devUrl).catch(() => {
      // If dev server takes a second, retry or load built file
      setTimeout(() => mainWindow.loadURL(devUrl), 1000);
    });
  } else {
    // In production, load the built index.html from build/
    const prodPath = path.join(__dirname, '..', 'build', 'index.html');
    mainWindow.loadFile(prodPath);
  }

  // Remove default menu for a clean application look
  mainWindow.setMenuBarVisibility(false);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers for Groq AI
ipcMain.handle('groq:chat', async (event, messages) => {
  return await groqService.handleChatMessage(messages);
});

ipcMain.handle('groq:check-key-status', async () => {
  return {
    configured: groqService.hasValidApiKey(),
    model: groqService.getModelName()
  };
});

ipcMain.handle('groq:update-key', async (event, key) => {
  groqService.setApiKey(key);
  return {
    success: true,
    configured: groqService.hasValidApiKey(),
    model: groqService.getModelName()
  };
});

ipcMain.handle('groq:get-model-info', async () => {
  return {
    model: groqService.getModelName()
  };
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
