const tabBar = document.getElementById('tab-bar');
const urlBar = document.getElementById('url-bar');
const newTabBtn = document.getElementById('new-tab');

function renderTabs(tabs) {
  const tabElements = tabBar.querySelectorAll('.tab');
  tabElements.forEach(el => el.remove());

  window.electronAPI.getActiveTabId().then(activeTabId => {
    tabs.forEach(tab => {
      const tabEl = document.createElement('div');
      tabEl.className = `tab ${tab.id === activeTabId ? 'active' : ''}`;
      tabEl.dataset.tabId = tab.id;

      const titleEl = document.createElement('span');
      titleEl.className = 'tab-title';
      titleEl.textContent = tab.url.split('/')[2] || tab.url;
      tabEl.appendChild(titleEl);

      const closeEl = document.createElement('span');
      closeEl.className = 'material-icons close-tab';
      closeEl.textContent = 'close';
      tabEl.appendChild(closeEl);

      tabBar.insertBefore(tabEl, urlBar);
    });
  });
}

newTabBtn.addEventListener('click', () => {
  window.electronAPI.createTab('https://www.google.com');
});

urlBar.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    window.electronAPI.getTabs().then(tabs => {
      window.electronAPI.getActiveTabId().then(activeTabId => {
        const active = tabs.find(t => t.id === activeTabId);
        if (active) {
          window.electronAPI.updateUrl(active.id, urlBar.value);
        }
      });
    });
  }
});

tabBar.addEventListener('click', (e) => {
  const tabEl = e.target.closest('.tab');
  if (!tabEl) return;

  const tabId = tabEl.dataset.tabId;
  if (e.target.classList.contains('close-tab')) {
    window.electronAPI.closeTab(tabId);
  } else {
    window.electronAPI.switchTab(tabId);
  }
});

window.electronAPI.getTabs().then(tabs => renderTabs(tabs));
const tabsUpdateListener = (event, tabs) => renderTabs(tabs);
const removeTabsUpdateListener = window.electronAPI.onTabsUpdate(tabsUpdateListener);
// Cleanup on window unload
window.addEventListener('unload', () => {
  ipcRenderer.removeListener('tabs-data', tabsUpdateListener);
});