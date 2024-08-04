  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'openLinks') {
      chrome.storage.sync.get('groups', (data) => {
        const group = data.groups[request.groupName];
        if (group) {
          group.forEach(url => chrome.tabs.create({ url }));
        }
      });
    } else if (request.action === 'saveLink') {
      chrome.storage.sync.get('groups', (data) => {
        const groups = data.groups || {};
        const group = groups[request.groupName] || [];
        group.push(request.url);
        groups[request.groupName] = group;
        chrome.storage.sync.set({ groups }, () => {
          sendResponse({ status: 'success' });
        });
      });
      return true; // Will respond asynchronously.
    }
  });
