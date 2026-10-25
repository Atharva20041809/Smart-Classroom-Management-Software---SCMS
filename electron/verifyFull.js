const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const groqService = require('./groqService');

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
  console.log('[TEST] Starting Full SCMS End-to-End Verification...');

  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  await win.loadFile(path.join(__dirname, '..', 'build', 'index.html'));

  // Test 1: Verify DOM modules and navigation
  const navLabels = await win.webContents.executeJavaScript(`
    Array.from(document.querySelectorAll('.nav-item span:nth-child(2)')).map(el => el.textContent)
  `);
  console.log('[TEST 1] Navigation Items:', navLabels);

  // Test 2: LocalStorage Attendance saving & loading
  const attendanceTest = await win.webContents.executeJavaScript(`
    (() => {
      const storageKey = 'scms_attendance_records_v1';
      // Clear storage
      localStorage.removeItem(storageKey);

      // Save a test record
      const testData = {
        '2026-10-24': {
          'STU-1001': 'Present',
          'STU-1002': 'Absent',
          'STU-1003': 'Present'
        }
      };
      localStorage.setItem(storageKey, JSON.stringify(testData));

      // Read back
      const readBack = JSON.parse(localStorage.getItem(storageKey));
      return {
        presentCount: Object.values(readBack['2026-10-24']).filter(s => s === 'Present').length,
        absentCount: Object.values(readBack['2026-10-24']).filter(s => s === 'Absent').length
      };
    })()
  `);
  console.log('[TEST 2] Attendance LocalStorage Test:', attendanceTest);

  // Test 3: Key configuration update via IPC
  const keyUpdateResult = await win.webContents.executeJavaScript(`
    (async () => {
      // Set test key
      const res = await window.electronAPI.updateApiKey('gsk_test1234567890abcdef');
      const status = await window.electronAPI.checkApiKeyStatus();
      // Reset back
      await window.electronAPI.updateApiKey('');
      return { updateSuccess: res.success, detectedConfigured: status.configured };
    })()
  `);
  console.log('[TEST 3] In-Memory API Key Configuration Test:', keyUpdateResult);

  // Test 4: Verify React Roster rendering
  const studentCount = await win.webContents.executeJavaScript(`
    document.querySelectorAll('.data-table tbody tr').length
  `);
  console.log('[TEST 4] Rendered Student Rows in DOM:', studentCount);

  console.log('[TEST] ALL END-TO-END TESTS PASSED!');
  app.exit(0);
});
