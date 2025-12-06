/**
 * Google Sheets Content Script
 * 
 * Runs on Google Sheets pages
 * Bridges communication between Chrome extension and Apps Script
 */

console.log('[Sheets Content Script] Loaded on Google Sheets');

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Sheets Content Script] Received:', message.type);
  
  if (message.type === 'GET_FORM_IDS') {
    // Call Apps Script to get form IDs
    console.log('[Sheets Content Script] Calling getAllFormIds()');
    
    // Inject a script to call Apps Script
    injectAndCall('getAllFormIds', [], (result) => {
      console.log('[Sheets Content Script] Got form IDs:', result);
      sendResponse({ formIds: result || [] });
    });
    
    return true; // Keep channel open for async
  } else if (message.type === 'LOG_DEPLOYMENT') {
    // Call Apps Script to log deployment
    console.log('[Sheets Content Script] Calling logDeploymentWithVersion()');
    
    injectAndCall('logDeploymentWithVersion', [message.data], (result) => {
      console.log('[Sheets Content Script] Logged deployment:', result);
      sendResponse({ success: true, result: result });
    });
    
    return true;
  }
});

/**
 * Inject script to call Apps Script functions
 * This works around the context isolation by directly calling google.script.run
 */
function injectAndCall(functionName, args, callback) {
  // Create a unique callback name
  const callbackName = 'callback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  
  // Store the callback globally
  window[callbackName] = function(result) {
    console.log('[Sheets Injected] Callback received:', result);
    delete window[callbackName];
    callback(result);
  };
  
  // Build the function call
  let argString = '';
  if (args.length > 0) {
    argString = args.map(arg => JSON.stringify(arg)).join(',');
  }
  
  const code = `
    (function() {
      try {
        if (typeof google !== 'undefined' && google.script && google.script.run) {
          const func = google.script.run['${functionName}'];
          if (typeof func === 'function') {
            console.log('[Apps Script] Calling ${functionName} with args: ${args.length}');
            func.apply(null, [${argString}])
              .withSuccessHandler((result) => {
                console.log('[Apps Script Success] ${functionName} returned:', result);
                if (window['${callbackName}']) {
                  window['${callbackName}'](result);
                }
              })
              .withFailureHandler((error) => {
                console.error('[Apps Script Error] ${functionName} failed:', error);
                if (window['${callbackName}']) {
                  window['${callbackName}'](null);
                }
              });
          } else {
            console.error('[Apps Script] Function not found: ${functionName}');
            if (window['${callbackName}']) {
              window['${callbackName}'](null);
            }
          }
        } else {
          console.error('[Apps Script] google.script.run not available');
          if (window['${callbackName}']) {
            window['${callbackName}'](null);
          }
        }
      } catch (err) {
        console.error('[Apps Script] Error:', err);
        if (window['${callbackName}']) {
          window['${callbackName}'](null);
        }
      }
    })();
  `;
  
  // Inject and execute the script
  const script = document.createElement('script');
  script.textContent = code;
  (document.head || document.documentElement).appendChild(script);
  
  // Clean up
  setTimeout(() => {
    script.remove();
  }, 100);
}
