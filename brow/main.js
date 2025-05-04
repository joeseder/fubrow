const { app, BrowserWindow, BrowserView, ipcMain } = require('electron');
const path = require('path');

let mainWindow = null;
let tabs = [];
let activeTabId = null;

function createMainWindow() {
  if (mainWindow) return mainWindow;

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('renderer/index.html');

  // Single resize listener
  mainWindow.on('resize', () => {
    console.log('Resize listeners:', mainWindow.listenerCount('resize'));
    console.log('Closed listeners:', mainWindow.listenerCount('closed'));
    if (activeTabId && mainWindow) {
      const activeTab = tabs.find(t => t.id === activeTabId);
      if (activeTab) {
        activeTab.view.setBounds({
          x: 0,
          y: 80,
          width: mainWindow.getBounds().width,
          height: mainWindow.getBounds().height - 80
        });
      }
    }
  });

  // Cleanup on close
  mainWindow.on('closed', () => {
    tabs.forEach(tab => mainWindow.removeBrowserView(tab.view));
    tabs = [];
    activeTabId = null;
    mainWindow = null;
  });

  return mainWindow;
}

function createTab(url = 'https://www.google.com') {
  if (!mainWindow) return null;

  const tabId = `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const view = new BrowserView({
    webPreferences: {
      nodeIntegration: false
    }
  });

  mainWindow.addBrowserView(view);
  const bounds = {
    x: 0,
    y: 80,
    width: mainWindow.getBounds().width,
    height: mainWindow.getBounds().height - 80
  };
  view.setBounds(bounds);
  view.setAutoResize({ width: true, height: true });
  view.webContents.loadURL(url);

  tabs.push({ id: tabId, view, url });
  if (!activeTabId) {
    setActiveTab(tabId);
  }

  mainWindow.webContents.send('tabs-data', tabs);
  return tabId;
}

function setActiveTab(tabId) {
  const tab = tabs.find(t => t.id === tabId);
  if (!tab || !mainWindow) return;

  tabs.forEach(t => {
    if (t.id !== tabId) {
      mainWindow.removeBrowserView(t.view);
      t.view.setBounds({ x: 0, y: 0, width: 0, height: 0 });
    }
  });

  mainWindow.addBrowserView(tab.view);
  const bounds = {
    x: 0,
    y: 80,
    width: mainWindow.getBounds().width,
    height: mainWindow.getBounds().height - 80
  };
  tab.view.setBounds(bounds);
  activeTabId = tabId;

  mainWindow.webContents.send('tabs-data', tabs);
}

function closeTab(tabId) {
  console.log('Tabs before close:', tabs.map(t => t.id));
  const tabIndex = tabs.findIndex(t => t.id === tabId);
  if (tabIndex === -1 || !mainWindow) return;

  const tab = tabs[tabIndex];
  mainWindow.removeBrowserView(tab.view);
  tabs.splice(tabIndex, 1);

  if (activeTabId === tabId && tabs.length > 0) {
    setActiveTab(tabs[0].id);
  } else if (tabs.length === 0) {
    activeTabId = null;
  }

  mainWindow.webContents.send('tabs-data', tabs);
  console.log('Tabs after close:', tabs.map(t => t.id));
}

// IPC Handlers
ipcMain.handle('create-tab', (event, url) => {
  return createTab(url);
});

ipcMain.handle('switch-tab', (event, tabId) => {
  setActiveTab(tabId);
});

ipcMain.handle('close-tab', (event, tabId) => {
  closeTab(tabId);
});

ipcMain.handle('update-url', (event, tabId, url) => {
  const tab = tabs.find(t => t.id === tabId);
  if (tab && mainWindow) {
    tab.url = url;
    tab.view.webContents.loadURL(url);
    mainWindow.webContents.send('tabs-data', tabs);
  }
});

ipcMain.handle('get-tabs', () => {
  return tabs;
});

ipcMain.handle('get-active-tab-id', () => activeTabId);

app.whenReady().then(() => {
  createMainWindow();
  createTab();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
    createTab();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});