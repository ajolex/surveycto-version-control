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

  if (message.type === 'GET_FORM_IDS') {
    handleGetFormIds(message, sender, sendResponse);
  } else if (message.type === 'LOG_DEPLOYMENT') {
    handleLogDeployment(message, sender, sendResponse);
  } else if (message.type === 'UPLOAD_FORM') {
    handleFormUpload(message, sender, sendResponse);
  } else if (message.type === 'CHECK_PAGE_READY') {
    handlePageReady(message, sender, sendResponse);
  } else if (message.type === 'UPLOAD_COMPLETE') {
    handleUploadComplete(message, sender, sendResponse);
  } else if (message.type === 'GET_DEPLOYMENT_DATA') {
    sendResponse({ 
      success: true, 
      data: deploymentContext.fileBlob ? deploymentContext : null 
    });
  }

  return true;
});

/**
 * Handle request for form IDs from Google Sheets
 */
function handleGetFormIds(message, sender, sendResponse) {
  console.log('[Background] Getting form IDs from Google Sheets');
  
  // Try to get from any Google Sheets tabs
  chrome.tabs.query({ url: '*://docs.google.com/spreadsheets/*' }, (tabs) => {
    if (tabs.length > 0) {
      // Send message to Google Sheets tab to get form IDs
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'GET_FORM_IDS',
        action: 'getAllFormIds'
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.log('[Background] Could not reach Sheets:', chrome.runtime.lastError);
          sendResponse({ formIds: [] });
        } else {
          console.log('[Background] Got form IDs:', response);
          sendResponse(response);
        }
      });
    } else {
      console.log('[Background] No Google Sheets tab found');
      sendResponse({ formIds: [] });
    }
  });
}

/**
 * Handle deployment logging from content script
 */
function handleLogDeployment(message, sender, sendResponse) {
  console.log('[Background] Logging deployment:', message);
  
  // Find a Google Sheets tab and send the logging request
  chrome.tabs.query({ url: '*://docs.google.com/spreadsheets/*' }, (tabs) => {
    if (tabs.length > 0) {
      // Send message to Google Sheets to log deployment
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'LOG_DEPLOYMENT',
        functionName: 'logDeploymentWithVersion',
        data: {
          formId: message.formId,
          deployedVersion: message.deployedVersion,
          formName: message.formId,
          message: message.message || ''
        }
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.log('[Background] Could not reach Sheets:', chrome.runtime.lastError);
          sendResponse({ success: false, error: 'Could not contact Google Sheets' });
        } else {
          console.log('[Background] Logged deployment:', response);
          sendResponse({ success: true, message: 'Deployment logged' });
        }
      });
    } else {
      console.log('[Background] No Google Sheets tab found - cannot log deployment');
      sendResponse({ success: false, error: 'No Google Sheets tab open' });
    }
  });
  
  return true;
}

/**
 * Handle form upload request from Apps Script
 */
function handleFormUpload(message, sender, sendResponse) {
  console.log('[Background] Received UPLOAD_FORM message');
  console.log('[Background] Form ID:', message.formId);
  console.log('[Background] File size:', message.fileBlob.size);

  deploymentContext = {
    fileBlob: message.fileBlob,
    fileName: message.fileName,
    formId: message.formId,
    message: message.message,
    attachmentBlobs: message.attachmentBlobs || [],
    tabId: null
  };

  console.log('[Background] Deployment context stored');

  // Open SurveyCTO Design page in a new tab
  const url = 'https://' + message.serverUrl + '/main.html#Design';
  console.log('[Background] Opening URL:', url);

  chrome.tabs.create(
    {
      url: url,
      active: true
    },
    (tab) => {
      deploymentContext.tabId = tab.id;
      console.log('[Background] Opened SurveyCTO in tab:', tab.id);
      console.log('[Background] Deployment context ready for content script to retrieve');
      
      sendResponse({
        success: true,
        message: 'Opening SurveyCTO. Auto-upload will begin shortly.',
        tabId: tab.id
      });
    }
  );
}

/**
 * Alternative: Handle upload notification from Apps Script (for sandbox workaround)
 * In this case, the file data is passed, and we store it for the content script
 */
function handleUploadNotification(message, sender, sendResponse) {
  console.log('[Background] Received upload notification');
  
  // Convert base64 back to blob if needed
  let fileBlob = message.fileBlob;
  if (typeof message.fileBlob === 'string') {
    // It's base64 encoded
    const byteCharacters = atob(message.fileBlob);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    fileBlob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  deploymentContext = {
    fileBlob: fileBlob,
    fileName: message.fileName,
    formId: message.formId,
    message: message.message || '',
    attachmentBlobs: message.attachmentBlobs || [],
    tabId: null
  };

  console.log('[Background] Deployment context stored from notification');

  // Open SurveyCTO Design page
  const serverUrl = message.serverUrl || 'pspsicm.surveycto.com';
  const url = 'https://' + serverUrl + '/main.html#Design';
  console.log('[Background] Opening URL:', url);

  chrome.tabs.create(
    {
      url: url,
      active: true
    },
    (tab) => {
      deploymentContext.tabId = tab.id;
      console.log('[Background] Opened SurveyCTO in tab:', tab.id);
      
      sendResponse({
        success: true,
        message: 'Opening SurveyCTO. Auto-upload will begin shortly.',
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
