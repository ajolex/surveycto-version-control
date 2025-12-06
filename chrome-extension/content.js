/**
 * SurveyCTO Form Uploader - Content Script
 * 
 * Runs on SurveyCTO Design page (/main.html#Design)
 * Handles form deployment following SurveyCTO's actual workflow:
 * 1. Detects when Design page is ready
 * 2. Clicks "+" button to add form
 * 3. Clicks "Upload form definition"
 * 4. Selects file source (computer upload)
 * 5. Fills file input with XLSX form definition
 * 6. Clicks Upload button
 * 7. Completes deployment
 */

console.log('[Content Script] ✅ Loaded on SurveyCTO Design page');

// Store deployment context
let deploymentData = null;
let selectedFormId = null;

/**
 * Notify background script that page is ready
 */
function notifyPageReady() {
  chrome.runtime.sendMessage(
    { type: 'CHECK_PAGE_READY' },
    (response) => {
      if (chrome.runtime.lastError) {
        console.log('[Content Script] Page ready signal - no deployment in progress');
      } else {
        console.log('[Content Script] Page ready signal sent');
      }
    }
  );
}

/**
 * Wait for SurveyCTO Design page to be ready
 * Design page shows a table of forms with action buttons
 */
function waitForPageReady() {
  const checkReady = setInterval(() => {
    // SurveyCTO Design page has a forms table with action buttons
    // Look for characteristic elements of the Design page
    const formTable = document.querySelector('table') || 
                      document.querySelector('[role="grid"]') ||
                      document.querySelector('[class*="form"]');
    
    if (formTable && document.readyState === 'complete') {
      clearInterval(checkReady);
      console.log('[Content Script] SurveyCTO Design page ready');
      
      // Give UI a moment to fully render
      setTimeout(() => {
        notifyPageReady();
      }, 1000);
    }
  }, 500);

  // Timeout: notify after 5 seconds anyway
  setTimeout(() => {
    clearInterval(checkReady);
    console.log('[Content Script] Page load timeout - notifying anyway');
    notifyPageReady();
  }, 5000);
}

/**
 * Listen for upload command from background script
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PERFORM_UPLOAD') {
    handleFormUpdate(message, sendResponse);
    return true; // Keep channel open for async response
  }
});

/**
 * Main form deployment handler
 * Follows SurveyCTO's documented deployment workflow
 */
function handleFormUpdate(message, sendResponse) {
  const { fileBlob, fileName, formId, attachmentBlobs } = message;
  
  console.log('[Content Script] 🚀 Starting form deployment for:', formId);
  console.log('[Content Script] File:', fileName, '(' + (fileBlob.size / 1024).toFixed(2) + ' KB)');
  if (attachmentBlobs && attachmentBlobs.length > 0) {
    console.log('[Content Script] Attachments:', attachmentBlobs.length, 'files');
    attachmentBlobs.forEach((att, i) => {
      console.log(`  [${i}] ${att.name} (${(att.blob.size / 1024).toFixed(2)} KB)`);
    });
  }
  
  deploymentData = { fileBlob, fileName, formId, attachmentBlobs };
  selectedFormId = formId;

  try {
    // Step 1: Click the "+" button to add a new form
    console.log('[Content Script] Step 1: Looking for + button to add form...');
    clickAddFormButton();
    
    // Step 2: Click "Upload form definition" option
    setTimeout(() => {
      console.log('[Content Script] Step 2: Looking for Upload form definition button...');
      clickUploadFormDefinition();
      
      // Step 3: Wait for dialog and handle file upload
      setTimeout(() => {
        console.log('[Content Script] Step 3: Handling file upload dialog...');
        handleFileUploadDialog(fileBlob, fileName, attachmentBlobs);
      }, 2000);
    }, 1500);
    
    sendResponse({ success: true, message: 'Form deployment workflow started' });
    
  } catch (error) {
    console.error('[Content Script] ❌ Deployment error:', error.message);
    notifyUploadComplete(false, 'Form deployment failed: ' + error.message);
    sendResponse({ success: false, error: error.message });
  }
}


/**
 * Click the "+" button to add a new form
 */
function clickAddFormButton() {
  console.log('[Content Script] === FIND ADD FORM BUTTON ===');
  
  // Look for "+" button - typically in a button or as text "+"
  const buttons = document.querySelectorAll('button');
  let addButton = null;

  // Search for button with "+" text
  for (let btn of buttons) {
    const text = btn.textContent.trim();
    console.log(`[Content Script] Button: "${text}"`);
    if (text === '+' || text.includes('Add form') || text.includes('add your first')) {
      if (!btn.disabled) {
        addButton = btn;
        console.log('[Content Script] ✅ Found + or Add button:', text);
        break;
      }
    }
  }

  if (addButton) {
    console.log('[Content Script] Clicking + button');
    addButton.click();
    console.log('[Content Script] ✅ Clicked + button');
  } else {
    console.warn('[Content Script] ⚠️  + button not found, trying alternative...');
    // If no button found, might need to look for menu items
    throw new Error('Could not find + button to add form');
  }
}

/**
 * Click "Upload form definition" option
 */
function clickUploadFormDefinition() {
  console.log('[Content Script] === FIND UPLOAD FORM DEFINITION ===');
  
  // Look for "Upload form definition" button or menu item
  const buttons = document.querySelectorAll('button, [role="menuitem"], li');
  let uploadButton = null;

  for (let element of buttons) {
    const text = element.textContent.toLowerCase();
    if (text.includes('upload form')) {
      console.log('[Content Script] ✅ Found Upload form definition:', element.textContent.trim());
      uploadButton = element;
      break;
    }
  }

  if (uploadButton) {
    console.log('[Content Script] Clicking Upload form definition');
    uploadButton.click();
    console.log('[Content Script] ✅ Clicked Upload form definition');
  } else {
    console.error('[Content Script] ❌ Upload form definition not found');
    throw new Error('Upload form definition option not found');
  }
}

/**
 * Handle the file upload dialog
 * This appears after clicking "Upload form definition"
 */
function handleFileUploadDialog(fileBlob, fileName, attachmentBlobs) {
  console.log('[Content Script] === HANDLING FILE UPLOAD DIALOG ===');
  
  let dialogFound = false;
  let checkCount = 0;
  
  const checkForDialog = setInterval(() => {
    checkCount++;
    console.log(`[Content Script] Dialog check #${checkCount}`);
    
    // Look for dialog/modal elements
    const dialog = document.querySelector('[role="dialog"]') || 
                   document.querySelector('.modal') ||
                   document.querySelector('[class*="dialog"]');
    
    if (dialog) {
      clearInterval(checkForDialog);
      dialogFound = true;
      console.log('[Content Script] ✅ Upload dialog found');
      
      setTimeout(() => {
        // Ensure "Select from your computer" is selected
        selectComputerUpload();
        
        // Wait a bit then fill file input
        setTimeout(() => {
          try {
            fillFileInput(fileBlob, fileName);
            
            // Handle attachments if provided
            if (attachmentBlobs && attachmentBlobs.length > 0) {
              console.log('[Content Script] Found attachments, enabling attachment upload...');
              setTimeout(() => {
                enableAttachments(attachmentBlobs);
              }, 1000);
            } else {
              // No attachments, proceed to upload
              setTimeout(() => {
                clickUploadButton();
              }, 1500);
            }
          } catch (err) {
            console.error('[Content Script] ❌ Error in file upload:', err.message);
            notifyUploadComplete(false, err.message);
          }
        }, 1000);
      }, 500);
    }
  }, 300);

  // Timeout
  setTimeout(() => {
    clearInterval(checkForDialog);
    if (!dialogFound) {
      console.error('[Content Script] ❌ TIMEOUT: Dialog not found after 15 seconds');
      notifyUploadComplete(false, 'Upload dialog did not appear');
    }
  }, 15000);
}

/**
 * Ensure "Select from your computer" is selected
 */
function selectComputerUpload() {
  console.log('[Content Script] === SELECT COMPUTER UPLOAD ===');
  
  // Look for radio buttons or buttons for file source
  const buttons = document.querySelectorAll('button, [role="button"]');
  let computerButton = null;

  for (let btn of buttons) {
    const text = btn.textContent.toLowerCase();
    console.log(`[Content Script] Option button: "${btn.textContent.trim()}"`);
    if (text.includes('computer') || text.includes('select from')) {
      computerButton = btn;
      console.log('[Content Script] ✅ Found "Select from your computer"');
      break;
    }
  }

  if (computerButton && !computerButton.disabled) {
    computerButton.click();
    console.log('[Content Script] ✅ Clicked "Select from your computer"');
  } else {
    console.log('[Content Script] "Select from your computer" already selected or not found');
  }
}

/**
 * Select file source in the upload dialog
 */
function selectFileSource() {
  console.log('[Content Script] === SELECT FILE SOURCE ===');
  
  // Look for radio buttons
  const radios = document.querySelectorAll('input[type="radio"]');
  console.log(`[Content Script] Found ${radios.length} radio buttons`);
  
  let computerOption = null;
  for (let radio of radios) {
    const label = document.querySelector(`label[for="${radio.id}"]`);
    const text = label ? label.textContent : '';
    console.log(`[Content Script] Radio: "${text}"`);
    
    if (text.includes('computer') || text.includes('your computer')) {
      computerOption = radio;
      console.log('[Content Script] ✅ Found computer upload option');
      break;
    }
  }

  if (computerOption && !computerOption.checked) {
    computerOption.click();
    computerOption.checked = true;
    
    const changeEvent = new Event('change', { bubbles: true });
    computerOption.dispatchEvent(changeEvent);
    console.log('[Content Script] ✅ Selected computer upload option');
  }
}

/**
 * Fill the file input with form definition
 */
function fillFileInput(fileBlob, fileName) {
  console.log('[Content Script] === FILL FILE INPUT ===');
  console.log('[Content Script] File name:', fileName);
  console.log('[Content Script] File blob size:', fileBlob.size, 'bytes');
  
  const fileInput = findFileInput();
  if (!fileInput) {
    console.error('[Content Script] ❌ File input not found');
    console.log('[Content Script] All file inputs on page:');
    const allInputs = document.querySelectorAll('input[type="file"]');
    console.log('[Content Script] Total file inputs:', allInputs.length);
    allInputs.forEach((input, i) => {
      console.log(`  Input ${i}:`, input.id, input.name, input.className);
    });
    throw new Error('File input not found in modal');
  }

  try {
    console.log('[Content Script] File input found:', fileInput.id, fileInput.name);
    
    // Create File object
    const file = new File([fileBlob], fileName, { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    console.log('[Content Script] File object created:', file.name, file.size);

    // Fill file input using DataTransfer
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInput.files = dataTransfer.files;

    console.log('[Content Script] Files assigned to input:', fileInput.files.length);
    if (fileInput.files.length > 0) {
      console.log('[Content Script] ✅ First file:', fileInput.files[0].name);
    }

    // Dispatch change event
    const changeEvent = new Event('change', { bubbles: true });
    fileInput.dispatchEvent(changeEvent);

    console.log('[Content Script] ✅ File input filled and change event fired');
  } catch (error) {
    console.error('[Content Script] ❌ Error filling file input:', error.message);
    throw error;
  }
}

/**
 * Find file input element on page
 */
function findFileInput() {
  // Try different selectors used by SurveyCTO
  const selectors = [
    'input[type="file"]',
    'input[id*="file"]',
    'input[id*="upload"]',
    'input[name*="file"]',
    'input[name*="upload"]'
  ];

  for (let selector of selectors) {
    const input = document.querySelector(selector);
    if (input) {
      console.log('[Content Script] Found file input:', selector);
      return input;
    }
  }

  // Last resort: find any file input
  const allInputs = document.querySelectorAll('input[type="file"]');
  if (allInputs.length > 0) {
    console.log('[Content Script] Found file input (generic search)');
    return allInputs[0];
  }

  return null;
}

/**
 * Enable attachment upload and add files
 */
function enableAttachments(attachmentBlobs) {
  console.log('[Content Script] === ENABLE ATTACHMENTS ===');
  console.log('[Content Script] Attachments to add:', attachmentBlobs.length);
  
  // Look for "Attach files?" toggle switch
  const toggles = document.querySelectorAll('input[type="checkbox"], [role="switch"]');
  let attachToggle = null;
  
  console.log(`[Content Script] Found ${toggles.length} toggles/checkboxes`);
  
  for (let toggle of toggles) {
    const label = toggle.parentElement?.textContent || '';
    console.log(`[Content Script] Toggle: "${label}"`);
    
    if (label.includes('Attach') || label.includes('attach')) {
      attachToggle = toggle;
      console.log('[Content Script] ✅ Found Attach files toggle');
      break;
    }
  }

  if (attachToggle && !attachToggle.checked) {
    console.log('[Content Script] Enabling attachment toggle');
    attachToggle.click();
    attachToggle.checked = true;
    
    const changeEvent = new Event('change', { bubbles: true });
    attachToggle.dispatchEvent(changeEvent);
    
    console.log('[Content Script] ✅ Attachment toggle enabled');
    
    // Wait for attachment file inputs to appear, then fill them
    setTimeout(() => {
      fillAttachments(attachmentBlobs);
    }, 1500);
  } else if (attachToggle && attachToggle.checked) {
    console.log('[Content Script] Attachment toggle already enabled');
    setTimeout(() => {
      fillAttachments(attachmentBlobs);
    }, 500);
  } else {
    console.warn('[Content Script] ⚠️  Attach files toggle not found, proceeding without attachments');
    clickUploadButton();
  }
}

/**
 * Fill attachment file inputs
 */
function fillAttachments(attachmentBlobs) {
  console.log('[Content Script] === FILL ATTACHMENTS ===');
  console.log('[Content Script] Filling', attachmentBlobs.length, 'attachments');
  
  // Find all file inputs (there may be multiple after enabling attachments)
  const fileInputs = document.querySelectorAll('input[type="file"]');
  console.log(`[Content Script] Found ${fileInputs.length} file inputs`);
  
  if (fileInputs.length < 2) {
    // Less than expected (1 for form + at least 1 for attachments)
    console.warn('[Content Script] ⚠️  Not enough file inputs found for attachments');
    clickUploadButton();
    return;
  }

  let attachmentIndex = 0;
  
  // Start from index 1 (skip the form definition file input at index 0)
  for (let i = 1; i < fileInputs.length && attachmentIndex < attachmentBlobs.length; i++) {
    const fileInput = fileInputs[i];
    const attachment = attachmentBlobs[attachmentIndex];
    
    try {
      console.log(`[Content Script] Adding attachment ${attachmentIndex + 1}: ${attachment.name}`);
      
      // Create File object from attachment
      const file = new File([attachment.blob], attachment.name);
      
      // Fill file input
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInput.files = dataTransfer.files;
      
      // Dispatch change event
      const changeEvent = new Event('change', { bubbles: true });
      fileInput.dispatchEvent(changeEvent);
      
      console.log(`[Content Script] ✅ Attachment ${attachmentIndex + 1} added: ${attachment.name}`);
      attachmentIndex++;
    } catch (error) {
      console.error(`[Content Script] ❌ Error adding attachment ${attachmentIndex}:`, error.message);
    }
  }

  if (attachmentIndex === attachmentBlobs.length) {
    console.log('[Content Script] ✅ All attachments added');
  } else {
    console.warn(`[Content Script] ⚠️  Only ${attachmentIndex}/${attachmentBlobs.length} attachments added`);
  }

  // Proceed to upload
  setTimeout(() => {
    clickUploadButton();
  }, 1000);
}

/**
 * Click the Upload button to submit the form
 */
function clickUploadButton() {
  console.log('[Content Script] === CLICK UPLOAD BUTTON ===');
  
  const buttons = document.querySelectorAll('button');
  console.log(`[Content Script] Found ${buttons.length} buttons`);
  
  let uploadButton = null;
  
  // Find the Upload button
  for (let btn of buttons) {
    const text = btn.textContent.toLowerCase().trim();
    if (text === 'upload' && !btn.disabled) {
      uploadButton = btn;
      console.log('[Content Script] ✅ Found Upload button');
      break;
    }
  }

  if (uploadButton) {
    console.log('[Content Script] Clicking Upload button');
    uploadButton.click();
    console.log('[Content Script] ✅ Upload button clicked');
    
    // Monitor for completion
    setTimeout(() => {
      console.log('[Content Script] === DEPLOYMENT COMPLETE ===');
      notifyUploadComplete(true, 'Form definition uploaded successfully');
    }, 3000);
  } else {
    console.error('[Content Script] ❌ Upload button not found');
    console.log('[Content Script] All buttons:');
    buttons.forEach((btn, i) => {
      console.log(`  ${i}: "${btn.textContent.trim()}" disabled=${btn.disabled}`);
    });
    notifyUploadComplete(false, 'Upload button not found');
  }
}

/**
 * Advance through modal dialog steps
 * Clicks Continue/Next buttons and handles deployment options
 */
function advanceModal() {
  console.log('[Content Script] === ADVANCE MODAL ===');
  
  // Look for action buttons in modal
  const buttons = document.querySelectorAll('[role="dialog"] button, .modal button, button');
  console.log(`[Content Script] Found ${buttons.length} buttons on page`);
  
  let continueButton = null;

  // Find Continue, Next, or Upload button
  for (let btn of buttons) {
    const text = btn.textContent.toLowerCase().trim();
    if (text === 'continue' || text === 'next' || text === 'upload' || text === 'proceed') {
      if (!btn.disabled) {
        continueButton = btn;
        console.log(`[Content Script] ✅ Found continue button: "${text}"`);
        break;
      } else {
        console.log(`[Content Script] Found "${text}" but it's disabled`);
      }
    }
  }

  if (continueButton) {
    console.log('[Content Script] Clicking continue button');
    continueButton.click();
    console.log('[Content Script] ✅ Clicked continue button');
    
    // Listen for the final step (deployment options)
    setTimeout(() => {
      console.log('[Content Script] Moving to deployment options...');
      handleDeploymentOptions();
    }, 2000);
  } else {
    console.warn('[Content Script] ⚠️  Continue button not found - listing all buttons:');
    buttons.forEach((btn, i) => {
      console.log(`  Button ${i}: "${btn.textContent.trim()}" disabled=${btn.disabled}`);
    });
    notifyUploadComplete(true, 'File uploaded but manual completion needed');
  }
}

/**
 * Handle deployment options step
 * Select "Deploy updated version immediately" option
 */
function handleDeploymentOptions() {
  console.log('[Content Script] === DEPLOYMENT OPTIONS ===');
  
  // Look for deployment option radio buttons
  const options = document.querySelectorAll('input[type="radio"]');
  console.log(`[Content Script] Found ${options.length} radio buttons for deployment options`);
  
  let deployNowOption = null;

  for (let option of options) {
    const label = document.querySelector(`label[for="${option.id}"]`);
    const labelText = label ? label.textContent : 'no label';
    console.log(`[Content Script] Radio option: "${labelText.substring(0, 50)}..."`);
    
    if (label && (
      label.textContent.includes('Deploy') || 
      label.textContent.includes('immediately') ||
      label.textContent.includes('deploy updated')
    )) {
      deployNowOption = option;
      console.log(`[Content Script] ✅ Found deploy now option: "${labelText.substring(0, 50)}"`);
      break;
    }
  }

  if (deployNowOption && !deployNowOption.checked) {
    console.log('[Content Script] Selecting deploy now option');
    deployNowOption.click();
    deployNowOption.checked = true;
    
    const changeEvent = new Event('change', { bubbles: true });
    deployNowOption.dispatchEvent(changeEvent);
    console.log('[Content Script] ✅ Deploy option selected');
  } else if (deployNowOption) {
    console.log('[Content Script] Deploy option already checked');
  } else {
    console.warn('[Content Script] ⚠️  No deploy now option found');
  }

  // Click the final Upload/Deploy button
  setTimeout(() => {
    console.log('[Content Script] Looking for final upload button...');
    clickFinalUploadButton();
  }, 1000);
}

/**
 * Notify background script that upload is complete
 */
function notifyUploadComplete(success, message) {
  chrome.runtime.sendMessage({
    type: 'UPLOAD_COMPLETE',
    success: success,
    message: message
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.log('[Content Script] Could not notify background:', chrome.runtime.lastError);
    }
  });
}

/**
 * Initialize when script loads
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Content Script] DOM loaded, waiting for page ready');
  waitForPageReady();
});

// Also check on load event
window.addEventListener('load', () => {
  console.log('[Content Script] Window loaded');
  notifyPageReady();
});

// If already loaded when script runs
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  console.log('[Content Script] Document already loaded');
  setTimeout(() => notifyPageReady(), 1000);
}
