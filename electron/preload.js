const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Chat messaging
  sendChatMessage: (messages) => ipcRenderer.invoke('groq:chat', messages),
  
  // Status check (does not leak key content to UI)
  checkApiKeyStatus: () => ipcRenderer.invoke('groq:check-key-status'),
  
  // Optional key configuration via UI if .env was not configured
  updateApiKey: (key) => ipcRenderer.invoke('groq:update-key', key),

  // Retrieve current active model name
  getModelInfo: () => ipcRenderer.invoke('groq:get-model-info')
});
