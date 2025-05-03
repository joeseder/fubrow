const { app, BrowserWindow, BrowserView } = require('electron');

app.whenReady().then(() => {
  const win = new BrowserWindow({ width: 1200, height: 800 });
  const view = new BrowserView();
  win.addBrowserView(view);
  view.setBounds({ x: 0, y: 80, width: 1200, height: 720 });
  view.webContents.loadURL('https://www.google.com');
});