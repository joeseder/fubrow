const { app, BrowserWindow, BrowserView } = require('electron');
const path = require('path');

let mainWindow;
let tabs = [];
let activeTabId = null;

function createMainWindow() {
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
  return mainWindow;
}

function createTab(url = 'https://www.google.com') {
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
  if (!tab) return;

  tabs.forEach(t => {
    mainWindow.removeBrowserView(t.view);
    t.view.setBounds({ x: 0, y: 0, width: 0, height: 0 });
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
  const tabIndex = tabs.findIndex(t => t.id === tabId);
  if (tabIndex === -1) return;

  const tab = tabs[tabIndex];
  mainWindow.removeBrowserView(tab.view);
  tab.view.destroy();
  tabs.splice(tabIndex, 1);

  if (activeTabId === tabId && tabs.length > 0) {
    setActiveTab(tabs[0].id);
  } else if (tabs.length === 0) {
    activeTabId = null;
  }

  mainWindow.webContents.send('tabs-data', tabs);
}

app.whenReady().then(() => {
  createMainWindow();
  createTab(); // Create initial tab

  mainWindow.on('resize', () => {
    if (activeTabId) {
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

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
      createTab();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});