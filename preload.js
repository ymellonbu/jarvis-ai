const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('jarvisAPI', {
  // Command processing
  processCommand: (text) => ipcRenderer.invoke('process-jarvis-command', text),

  // Direct PC control
  directAction: (actionType, payload) => ipcRenderer.invoke('direct-pc-action', { actionType, payload }),

  // Research topic directly
  researchTopic: (query) => ipcRenderer.invoke('research-topic', query),

  // Installed Windows apps list
  getInstalledApps: () => ipcRenderer.invoke('get-installed-apps'),

  // Trigger Windows Voice Typing (Win + H)
  triggerVoiceTyping: () => ipcRenderer.invoke('trigger-voice-typing'),

  // System stats
  getSystemStats: () => ipcRenderer.invoke('get-system-stats'),

  // Settings
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),

  // App window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close')
});
