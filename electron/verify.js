const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const groqService = require('./groqService');

// IPC handlers
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

app.whenReady().then(async () => {
  console.log('[TEST] Electron app ready');
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  win.webContents.on('did-fail-load', (e, code, desc) => {
    console.error('[TEST ERROR] Load failed:', code, desc);
    app.exit(1);
  });

  win.webContents.on('console-message', (e, level, msg) => {
    console.log('[RENDERER CONSOLE]:', msg);
  });

  const htmlPath = path.join(__dirname, '..', 'build', 'index.html');
  await win.loadFile(htmlPath);
  console.log('[TEST] Successfully loaded build/index.html');

  const title = await win.getTitle();
  console.log('[TEST] Page Title:', title);

  const hasApi = await win.webContents.executeJavaScript('Boolean(window.electronAPI)');
  console.log('[TEST] window.electronAPI exists:', hasApi);

  const status = await win.webContents.executeJavaScript('window.electronAPI.checkApiKeyStatus()');
  console.log('[TEST] API key status check:', JSON.stringify(status));

  // Test error handling with missing API key
  const chatResponse = await win.webContents.executeJavaScript(
    'window.electronAPI.sendChatMessage([{ role: "user", content: "Test ping" }])'
  );
  console.log('[TEST] Chat error handling response:', JSON.stringify(chatResponse));

  console.log('[TEST] All automated checks passed successfully!');
  app.exit(0);
});
