const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  createTab: (url) => ipcRenderer.invoke('create-tab', url),
  switchTab: (tabId) => ipcRenderer.invoke('switch-tab', tabId),
  closeTab: (tabId) => ipcRenderer.invoke('close-tab', tabId),
  updateUrl: (tabId, url) => ipcRenderer.invoke('update-url', tabId, url),
  getTabs: () => ipcRenderer.invoke('get-tabs'),
  onTabsUpdate: (callback) => ipcRenderer.on('tabs-data', callback)
});