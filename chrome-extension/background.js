/**
 * SurveyCTO Form Uploader - Background Service Worker
 * 
 * Handles:
 * - Communication between Google Apps Script and Chrome extension
 * - File transfer and upload coordination
 * - Tab management
 */

// Store deployment context
let deploymentContext = {
  fileBlob: null,
  fileName: null,
  formId: null,
  message: null,
  tabId: null
};

/**
 * Listen for messages from content script and other parts of extension
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Background] Received message:', message.type);

  if (message.type === 'UPLOAD_FORM') {
    handleFormUpload(message, sender, sendResponse);
  } else if (message.type === 'CHECK_PAGE_READY') {
    handlePageReady(message, sender, sendResponse);
  } else if (message.type === 'UPLOAD_COMPLETE') {
    handleUploadComplete(message, sender, sendResponse);
  } else if (message.type === 'GET_DEPLOYMENT_DATA') {
    sendResponse({ success: true, data: deploymentContext });
  }

  // Return true to indicate async response
  return true;
});

/**
 * Handle form upload request from Apps Script
 */
function handleFormUpload(message, sender, sendResponse) {
  deploymentContext = {
    fileBlob: message.fileBlob,
    fileName: message.fileName,
    formId: message.formId,
    message: message.message,
    tabId: null
  };

  console.log('[Background] Starting upload for form:', message.formId);

  // Open SurveyCTO Design page in a new tab
  chrome.tabs.create(
    {
      url: 'https://' + message.serverUrl + '/main.html#Design',
      active: true
    },
    (tab) => {
      deploymentContext.tabId = tab.id;
      console.log('[Background] Opened SurveyCTO console in tab:', tab.id);
      
      sendResponse({
        success: true,
        message: 'Opening SurveyCTO console. Auto-upload will begin shortly.',
        tabId: tab.id
      });
    }
  );
}

/**
 * Handle page ready signal from content script
 */
function handlePageReady(message, sender, sendResponse) {
  const tabId = sender.tab.id;
  console.log('[Background] Console page ready in tab:', tabId);

  if (deploymentContext.fileBlob && tabId === deploymentContext.tabId) {
    // Send file upload data to content script
    chrome.tabs.sendMessage(tabId, {
      type: 'PERFORM_UPLOAD',
      fileBlob: deploymentContext.fileBlob,
      fileName: deploymentContext.fileName,
      formId: deploymentContext.formId
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[Background] Error sending upload command:', chrome.runtime.lastError);
        sendResponse({ success: false, error: 'Failed to send upload command' });
      } else {
        console.log('[Background] Upload command sent to content script');
        sendResponse({ success: true, message: 'Upload in progress' });
      }
    });
  } else {
    sendResponse({ success: false, error: 'No deployment in progress' });
  }
}

/**
 * Handle upload completion
 */
function handleUploadComplete(message, sender, sendResponse) {
  console.log('[Background] Upload completed:', message);
  
  // Store result for later retrieval
  deploymentContext.uploadResult = {
    success: message.success,
    message: message.message,
    timestamp: new Date().toISOString()
  };

  sendResponse({ success: true, message: 'Upload result recorded' });
}

/**
 * Clean up old deployments when extension loads
 */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[Background] Extension installed');
    // Open options page on first install
    chrome.runtime.openOptionsPage();
  } else if (details.reason === 'update') {
    console.log('[Background] Extension updated');
  }
});

/**
 * Listen for tab close events to clean up
 */
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === deploymentContext.tabId) {
    console.log('[Background] SurveyCTO tab closed');
    // Optional: Store the upload result if available
  }
});
