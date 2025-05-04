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

// Prevent duplicate listeners
newTabBtn.removeEventListener('click', handleNewTab);
function handleNewTab() {
  console.log('Creating new tab');
  window.electronAPI.createTab('https://www.google.com');
}
newTabBtn.addEventListener('click', handleNewTab);

urlBar.removeEventListener('keypress', handleUrlBar);
function handleUrlBar(e) {
  if (e.key === 'Enter') {
    const url = urlBar.value.trim();
    console.log('Updating URL:', url);
    if (url) {
      window.electronAPI.getActiveTabId().then(activeTabId => {
        if (activeTabId) {
          window.electronAPI.updateUrl(activeTabId, url);
        }
      });
    }
  }
}
urlBar.addEventListener('keypress', handleUrlBar);

tabBar.removeEventListener('click', handleTabClick);
function handleTabClick(e) {
  const tabEl = e.target.closest('.tab');
  if (!tabEl) return;

  const tabId = tabEl.dataset.tabId;
  if (e.target.classList.contains('close-tab')) {
    console.log('Closing tab:', tabId);
    window.electronAPI.closeTab(tabId);
  } else {
    console.log('Switching to tab:', tabId);
    window.electronAPI.switchTab(tabId);
  }
}
tabBar.addEventListener('click', handleTabClick);

window.electronAPI.getTabs().then(tabs => {
  console.log('Initial tabs:', tabs);
  renderTabs(tabs);
});

const tabsUpdateListener = (event, tabs) => {
  console.log('Tabs update:', tabs);
  renderTabs(tabs);
};
const removeTabsUpdateListener = window.electronAPI.onTabsUpdate(tabsUpdateListener);

window.addEventListener('unload', () => {
  console.log('Cleaning up tabsUpdateListener');
  removeTabsUpdateListener();
  newTabBtn.removeEventListener('click', handleNewTab);
  urlBar.removeEventListener('keypress', handleUrlBar);
  tabBar.removeEventListener('click', handleTabClick);
});