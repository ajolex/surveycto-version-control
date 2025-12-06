/**
 * Options page script
 */

const DEFAULTS = {
  autoSubmit: true,
  uploadTimeout: 30,
  debugMode: false
};

/**
 * Load saved options
 */
function loadOptions() {
  chrome.storage.sync.get(DEFAULTS, (items) => {
    document.getElementById('autoSubmit').checked = items.autoSubmit;
    document.getElementById('uploadTimeout').value = items.uploadTimeout;
    document.getElementById('debugMode').checked = items.debugMode;
  });
}

/**
 * Save options
 */
document.getElementById('saveButton').addEventListener('click', () => {
  const autoSubmit = document.getElementById('autoSubmit').checked;
  const uploadTimeout = parseInt(document.getElementById('uploadTimeout').value) || 30;
  const debugMode = document.getElementById('debugMode').checked;

  chrome.storage.sync.set({
    autoSubmit: autoSubmit,
    uploadTimeout: uploadTimeout,
    debugMode: debugMode
  }, () => {
    showStatus('success', '✅ Options saved successfully!');
    
    // Clear message after 2 seconds
    setTimeout(() => {
      clearStatus();
    }, 2000);
  });
});

/**
 * Reset to defaults
 */
document.getElementById('resetButton').addEventListener('click', () => {
  if (confirm('Reset all options to default values?')) {
    chrome.storage.sync.set(DEFAULTS, () => {
      loadOptions();
      showStatus('success', '✅ Options reset to defaults');
      
      setTimeout(() => {
        clearStatus();
      }, 2000);
    });
  }
});

/**
 * Show status message
 */
function showStatus(type, message) {
  const statusEl = document.getElementById('status');
  statusEl.textContent = message;
  statusEl.className = type;
}

/**
 * Clear status message
 */
function clearStatus() {
  const statusEl = document.getElementById('status');
  statusEl.textContent = '';
  statusEl.className = '';
}

/**
 * Load options on page load
 */
document.addEventListener('DOMContentLoaded', loadOptions);
