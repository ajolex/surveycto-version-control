/**
 * Popup script for SurveyCTO Form Uploader extension
 */

document.getElementById('openOptions').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
  window.close();
});

document.getElementById('viewDocs').addEventListener('click', () => {
  chrome.tabs.create({
    url: 'https://github.com/ajolex/surveycto-version-control'
  });
  window.close();
});

/**
 * Check deployment status on popup open
 */
chrome.runtime.sendMessage(
  { type: 'GET_DEPLOYMENT_DATA' },
  (response) => {
    if (response && response.data && response.data.fileBlob) {
      document.getElementById('status').textContent = '📤 Upload in progress...';
      document.getElementById('status').className = 'status active';
    }
  }
);
