/**
 * SurveyCTO Version Control - Google Apps Script Add-on
 * 
 * Main Apps Script that creates a menu for SurveyCTO Version Control,
 * handles deployment logic with auto-incrementing versions, manages
 * version history sheet, integrates with SurveyCTO API, stores
 * credentials securely, and provides export functionality.
 */

// ============================================
// CONSTANTS
// ============================================
const VERSION_HISTORY_SHEET_NAME = 'Version History';
const SETTINGS_SHEET_NAME = 'settings';
const SURVEY_SHEET_NAME = 'survey';
const CHOICES_SHEET_NAME = 'choices';
const PROPERTY_SERVER_URL = 'surveycto_server_url';
const PROPERTY_USERNAME = 'surveycto_username';
const PROPERTY_PASSWORD = 'surveycto_password';

// ============================================
// SPREADSHEET FORM DETECTION
// ============================================

/**
 * Gets form details from the Settings sheet of the current spreadsheet.
 * Looks for form_id and form_title in the Settings sheet.
 * IMPORTANT: Uses getDisplayValues() to capture the current calculated value
 * of formula-based form_ids (e.g., timestamp-based IDs like "2512051430").
 * @returns {Object} Object containing formId, formTitle, and other settings.
 */
function getFormDetailsFromSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Try to find Settings sheet (case-insensitive)
  let settingsSheet = null;
  const sheets = ss.getSheets();
  for (let i = 0; i < sheets.length; i++) {
    const name = sheets[i].getName().toLowerCase();
    if (name === 'settings' || name === 'setting') {
      settingsSheet = sheets[i];
      break;
    }
  }
  
  if (!settingsSheet) {
    return {
      found: false,
      error: 'No "Settings" sheet found in this spreadsheet.'
    };
  }
  
  // Read the settings data - use getDisplayValues() to get the CURRENT calculated
  // value of any formulas (important for dynamic form_id formulas like timestamp-based IDs)
  const dataRange = settingsSheet.getDataRange();
  const headers = dataRange.getValues()[0]; // Headers are usually plain text
  const displayValues = dataRange.getDisplayValues(); // Gets current formula results as strings
  
  if (displayValues.length === 0) {
    return {
      found: false,
      error: 'Settings sheet is empty.'
    };
  }
  
  // Get headers (first row) - normalized to lowercase for matching
  const normalizedHeaders = headers.map(h => String(h).toLowerCase().trim());
  
  // Find column indices for common SurveyCTO settings fields
  const formIdIndex = normalizedHeaders.findIndex(h => h === 'form_id' || h === 'formid');
  const formTitleIndex = normalizedHeaders.findIndex(h => h === 'form_title' || h === 'title');
  const versionIndex = normalizedHeaders.findIndex(h => h === 'version');
  
  // Extract values (second row typically contains the values in SurveyCTO format)
  if (displayValues.length < 2) {
    return {
      found: false,
      error: 'Settings sheet has no data rows.'
    };
  }
  
  // Use displayValues to capture the exact current value (handles formulas correctly)
  const values = displayValues[1];
  
  const result = {
    found: true,
    formId: formIdIndex >= 0 ? String(values[formIdIndex]).trim() : '',
    formTitle: formTitleIndex >= 0 ? String(values[formTitleIndex]).trim() : '',
    version: versionIndex >= 0 ? String(values[versionIndex]).trim() : ''
  };
  
  // Use form_id as fallback for title if title is empty
  if (!result.formTitle && result.formId) {
    result.formTitle = result.formId;
  }
  
  // Validate that we have at least a form_id
  if (!result.formId) {
    return {
      found: false,
      error: 'No "form_id" column found in Settings sheet, or form_id is empty.'
    };
  }
  
  return result;
}

/**
 * Checks if the current spreadsheet has the standard SurveyCTO form structure.
 * @returns {Object} Object with hasSettings, hasSurvey, hasChoices booleans.
 */
function checkSpreadsheetStructure() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  const sheetNames = sheets.map(s => s.getName().toLowerCase());
  
  return {
    hasSettings: sheetNames.some(n => n === 'settings' || n === 'setting'),
    hasSurvey: sheetNames.some(n => n === 'survey'),
    hasChoices: sheetNames.some(n => n === 'choices' || n === 'choice'),
    isSurveyCTOForm: sheetNames.some(n => n === 'settings' || n === 'setting') && 
                     sheetNames.some(n => n === 'survey'),
    allSheets: sheets.map(s => s.getName())
  };
}

/**
 * Gets the form info for deployment - combines spreadsheet data with manual input.
 * @returns {Object} Form information for deployment.
 */
function getCurrentFormInfo() {
  const spreadsheetDetails = getFormDetailsFromSpreadsheet();
  const structure = checkSpreadsheetStructure();
  
  return {
    spreadsheet: spreadsheetDetails,
    structure: structure,
    spreadsheetName: SpreadsheetApp.getActiveSpreadsheet().getName(),
    spreadsheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl()
  };
}

/**
 * Gets the FRESH form ID from the Settings sheet at the exact moment of calling.
 * This is critical for formula-based form IDs (like timestamp-based IDs) that change over time.
 * Call this right before deployment to capture the exact form_id value.
 * @returns {Object} Object with formId and formTitle at this exact moment.
 */
function getFreshFormIdForDeployment() {
  const details = getFormDetailsFromSpreadsheet();
  
  if (!details.found) {
    return {
      success: false,
      error: details.error
    };
  }
  
  return {
    success: true,
    formId: details.formId,
    formTitle: details.formTitle,
    capturedAt: new Date().toISOString()
  };
}

// ============================================
// MENU & UI FUNCTIONS
// ============================================

/**
 * Creates the add-on menu when the spreadsheet opens.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('SurveyCTO Version Control')
    .addItem('Open Sidebar', 'showSidebar')
    .addItem('Deploy Form', 'showDeployDialog')
    .addSeparator()
    .addItem('View Version History', 'showVersionHistory')
    .addItem('Export to CSV', 'exportVersionHistoryToCsv')
    .addSeparator()
    .addItem('Settings', 'showSettingsDialog')
    .addToUi();
}

/**
 * Shows the sidebar UI.
 */
function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('SurveyCTO Version Control')
    .setWidth(300);
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Shows the deployment dialog.
 */
function showDeployDialog() {
  const html = HtmlService.createHtmlOutputFromFile('Dialog')
    .setWidth(450)
    .setHeight(350);
  SpreadsheetApp.getUi().showModalDialog(html, 'Deploy Form');
}

/**
 * Shows the settings dialog.
 */
function showSettingsDialog() {
  const html = HtmlService.createHtmlOutputFromFile('Settings')
    .setWidth(450)
    .setHeight(400);
  SpreadsheetApp.getUi().showModalDialog(html, 'Settings');
}

/**
 * Navigates to the Version History sheet.
 */
function showVersionHistory() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(VERSION_HISTORY_SHEET_NAME);
  
  if (!sheet) {
    sheet = createVersionHistorySheet();
  }
  
  ss.setActiveSheet(sheet);
  SpreadsheetApp.getUi().alert('Version History sheet is now active.');
}

// ============================================
// VERSION HISTORY MANAGEMENT
// ============================================

/**
 * Creates the Version History sheet if it doesn't exist.
 * @returns {Sheet} The Version History sheet.
 */
function createVersionHistorySheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(VERSION_HISTORY_SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(VERSION_HISTORY_SHEET_NAME);
    
    // Set up headers
    const headers = [
      'Version',
      'Form ID',
      'Form Name',
      'Deployed By',
      'Timestamp',
      'Message',
      'Status'
    ];
    
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#4285f4')
      .setFontColor('white');
    
    // Freeze header row
    sheet.setFrozenRows(1);
    
    // Set column widths
    sheet.setColumnWidth(1, 80);   // Version
    sheet.setColumnWidth(2, 120);  // Form ID
    sheet.setColumnWidth(3, 200);  // Form Name
    sheet.setColumnWidth(4, 150);  // Deployed By
    sheet.setColumnWidth(5, 180);  // Timestamp
    sheet.setColumnWidth(6, 300);  // Message
    sheet.setColumnWidth(7, 100);  // Status
  }
  
  return sheet;
}

/**
 * Gets the next version number based on the history.
 * @param {string} formId - The form ID to get the version for.
 * @returns {string} The next version number (e.g., "v1.0", "v1.1").
 */
function getNextVersion(formId) {
  const sheet = createVersionHistorySheet();
  const data = sheet.getDataRange().getValues();
  
  let maxMajor = 0;
  let maxMinor = -1;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === formId) {
      const versionStr = String(data[i][0]);
      const match = versionStr.match(/v?(\d+)\.(\d+)/);
      if (match) {
        const major = parseInt(match[1], 10);
        const minor = parseInt(match[2], 10);
        
        if (major > maxMajor || (major === maxMajor && minor > maxMinor)) {
          maxMajor = major;
          maxMinor = minor;
        }
      }
    }
  }
  
  // If no previous version, start at v1.0
  if (maxMinor === -1) {
    return 'v1.0';
  }
  
  // Increment minor version
  return `v${maxMajor}.${maxMinor + 1}`;
}

/**
 * Logs a deployment to the Version History sheet.
 * @param {Object} deployment - The deployment details.
 * @returns {Object} The logged deployment with version.
 */
function logDeployment(deployment) {
  const sheet = createVersionHistorySheet();
  const version = getNextVersion(deployment.formId);
  const timestamp = new Date().toISOString();
  const user = Session.getActiveUser().getEmail() || 'Unknown User';
  
  const row = [
    version,
    deployment.formId,
    deployment.formName,
    user,
    timestamp,
    deployment.message,
    deployment.status || 'Pending'
  ];
  
  sheet.appendRow(row);
  
  return {
    version: version,
    formId: deployment.formId,
    formName: deployment.formName,
    deployedBy: user,
    timestamp: timestamp,
    message: deployment.message,
    status: deployment.status
  };
}

/**
 * Updates the status of the last deployment for a form.
 * @param {string} formId - The form ID.
 * @param {string} status - The new status.
 */
function updateDeploymentStatus(formId, status) {
  const sheet = createVersionHistorySheet();
  const data = sheet.getDataRange().getValues();
  
  // Find the last row for this form
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][1] === formId) {
      sheet.getRange(i + 1, 7).setValue(status);
      return;
    }
  }
}

/**
 * Gets the version history for display.
 * @param {number} limit - Maximum number of entries to return.
 * @returns {Array} Array of version history entries.
 */
function getVersionHistory(limit) {
  const sheet = createVersionHistorySheet();
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return [];
  }
  
  const history = [];
  const startRow = Math.max(1, data.length - (limit || 10));
  
  for (let i = data.length - 1; i >= startRow; i--) {
    history.push({
      version: data[i][0],
      formId: data[i][1],
      formName: data[i][2],
      deployedBy: data[i][3],
      timestamp: data[i][4],
      message: data[i][5],
      status: data[i][6]
    });
  }
  
  return history;
}

// ============================================
// SURVEYCTO API INTEGRATION
// ============================================

/**
 * Gets the stored SurveyCTO credentials.
 * @returns {Object} The credentials object.
 */
function getCredentials() {
  const props = PropertiesService.getUserProperties();
  return {
    serverUrl: props.getProperty(PROPERTY_SERVER_URL) || '',
    username: props.getProperty(PROPERTY_USERNAME) || '',
    password: props.getProperty(PROPERTY_PASSWORD) || ''
  };
}

/**
 * Saves SurveyCTO credentials securely.
 * @param {Object} credentials - The credentials to save.
 */
function saveCredentials(credentials) {
  const props = PropertiesService.getUserProperties();
  
  if (credentials.serverUrl !== undefined) {
    props.setProperty(PROPERTY_SERVER_URL, credentials.serverUrl);
  }
  if (credentials.username !== undefined) {
    props.setProperty(PROPERTY_USERNAME, credentials.username);
  }
  if (credentials.password !== undefined) {
    props.setProperty(PROPERTY_PASSWORD, credentials.password);
  }
}

/**
 * Tests the SurveyCTO API connection.
 * @returns {Object} The test result.
 */
function testConnection() {
  const creds = getCredentials();
  
  if (!creds.serverUrl || !creds.username || !creds.password) {
    return {
      success: false,
      message: 'Please configure all credentials first.'
    };
  }
  
  try {
    // Normalize server URL
    let serverUrl = creds.serverUrl.trim();
    if (!serverUrl.startsWith('https://')) {
      serverUrl = 'https://' + serverUrl;
    }
    if (!serverUrl.endsWith('.surveycto.com')) {
      serverUrl = serverUrl + '.surveycto.com';
    }
    
    // Test with forms API endpoint
    const url = serverUrl + '/api/v1/forms';
    const options = {
      method: 'get',
      headers: {
        'Authorization': 'Basic ' + Utilities.base64Encode(creds.username + ':' + creds.password)
      },
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const code = response.getResponseCode();
    
    if (code === 200) {
      return {
        success: true,
        message: 'Connection successful!'
      };
    } else if (code === 401) {
      return {
        success: false,
        message: 'Authentication failed. Please check your username and password.'
      };
    } else {
      return {
        success: false,
        message: 'Connection failed with status code: ' + code
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Connection error: ' + error.message
    };
  }
}

/**
 * Gets the list of forms from SurveyCTO.
 * @returns {Array} Array of form objects.
 */
function getForms() {
  const creds = getCredentials();
  
  if (!creds.serverUrl || !creds.username || !creds.password) {
    return [];
  }
  
  try {
    // Normalize server URL
    let serverUrl = creds.serverUrl.trim();
    if (!serverUrl.startsWith('https://')) {
      serverUrl = 'https://' + serverUrl;
    }
    if (!serverUrl.endsWith('.surveycto.com')) {
      serverUrl = serverUrl + '.surveycto.com';
    }
    
    const url = serverUrl + '/api/v1/forms';
    const options = {
      method: 'get',
      headers: {
        'Authorization': 'Basic ' + Utilities.base64Encode(creds.username + ':' + creds.password)
      },
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const code = response.getResponseCode();
    
    if (code === 200) {
      const forms = JSON.parse(response.getContentText());
      return forms.map(form => ({
        id: form.id || form.formId,
        name: form.title || form.name || form.id
      }));
    }
    
    return [];
  } catch (error) {
    Logger.log('Error fetching forms: ' + error.message);
    return [];
  }
}

/**
 * Deploys a form to SurveyCTO.
 * This exports the current spreadsheet as XLSX and uploads it to SurveyCTO.
 * @param {Object} formData - The form data to deploy.
 * @returns {Object} The deployment result.
 */
function deployForm(formData) {
  const creds = getCredentials();
  
  // Validate inputs
  if (!formData || !formData.formId) {
    return {
      success: false,
      message: 'Form ID is required.'
    };
  }
  
  if (!formData.message || formData.message.trim() === '') {
    return {
      success: false,
      message: 'Deployment message is required.'
    };
  }
  
  if (!creds.serverUrl || !creds.username || !creds.password) {
    return {
      success: false,
      message: 'Please configure your SurveyCTO credentials in Settings.'
    };
  }
  
  try {
    // Log the deployment first (as Pending)
    const logged = logDeployment({
      formId: formData.formId,
      formName: formData.formName || formData.formId,
      message: formData.message,
      status: 'Pending'
    });
    
    // Normalize server URL
    let serverUrl = creds.serverUrl.trim();
    if (!serverUrl.startsWith('https://')) {
      serverUrl = 'https://' + serverUrl;
    }
    if (!serverUrl.endsWith('.surveycto.com')) {
      serverUrl = serverUrl + '.surveycto.com';
    }
    
    // Export the current spreadsheet as XLSX for upload
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const spreadsheetId = ss.getId();
    
    // Get the XLSX export URL
    const xlsxUrl = 'https://docs.google.com/spreadsheets/d/' + spreadsheetId + '/export?format=xlsx';
    
    // Fetch the XLSX file content
    const xlsxBlob = UrlFetchApp.fetch(xlsxUrl, {
      headers: {
        'Authorization': 'Bearer ' + ScriptApp.getOAuthToken()
      }
    }).getBlob();
    
    // Set filename for the blob
    xlsxBlob.setName(formData.formId + '.xlsx');
    
    // SurveyCTO form upload endpoint
    // The actual API endpoint for uploading forms
    const uploadUrl = serverUrl + '/api/v2/forms/upload';
    
    // Create multipart form data
    const boundary = '----WebKitFormBoundary' + Utilities.getUuid();
    
    // Build the multipart payload
    const payload = Utilities.newBlob(
      '--' + boundary + '\r\n' +
      'Content-Disposition: form-data; name="form_file"; filename="' + formData.formId + '.xlsx"\r\n' +
      'Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n'
    ).getBytes()
    .concat(xlsxBlob.getBytes())
    .concat(Utilities.newBlob('\r\n--' + boundary + '--\r\n').getBytes());
    
    const options = {
      method: 'post',
      headers: {
        'Authorization': 'Basic ' + Utilities.base64Encode(creds.username + ':' + creds.password),
        'Content-Type': 'multipart/form-data; boundary=' + boundary
      },
      payload: payload,
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(uploadUrl, options);
    const code = response.getResponseCode();
    const responseText = response.getContentText();
    
    if (code >= 200 && code < 300) {
      updateDeploymentStatus(formData.formId, 'Success');
      return {
        success: true,
        message: 'Form deployed successfully to SurveyCTO!',
        version: logged.version,
        deployment: logged
      };
    } else if (code === 401) {
      updateDeploymentStatus(formData.formId, 'Failed - Auth');
      return {
        success: false,
        message: 'Authentication failed. Please check your credentials.'
      };
    } else if (code === 404 || code === 405) {
      // API endpoint might not be available on all servers
      // Fall back to logging only
      updateDeploymentStatus(formData.formId, 'Logged (Manual deploy required)');
      return {
        success: true,
        message: 'Deployment logged. Version: ' + logged.version + '. Note: Automatic upload not available - please deploy manually via SurveyCTO console.',
        version: logged.version,
        deployment: logged,
        requiresManualDeploy: true
      };
    } else {
      updateDeploymentStatus(formData.formId, 'Failed');
      
      // Try to parse error message from response
      let errorMsg = 'Deployment failed with status: ' + code;
      try {
        const errorJson = JSON.parse(responseText);
        if (errorJson.message || errorJson.error) {
          errorMsg = errorJson.message || errorJson.error;
        }
      } catch (e) {
        // Use raw response if not JSON
        if (responseText && responseText.length < 200) {
          errorMsg += ' - ' + responseText;
        }
      }
      
      return {
        success: false,
        message: errorMsg
      };
    }
  } catch (error) {
    // If there's a network error or other issue, still log the deployment
    if (formData.formId) {
      try {
        updateDeploymentStatus(formData.formId, 'Logged (Offline)');
      } catch (e) {
        // Ignore logging errors
      }
    }
    return {
      success: true,
      message: 'Deployment logged locally (Version: ' + getNextVersion(formData.formId) + '). API call failed: ' + error.message,
      version: getNextVersion(formData.formId),
      requiresManualDeploy: true
    };
  }
}

// ============================================
// EXPORT FUNCTIONALITY
// ============================================

/**
 * Exports the version history to a CSV file.
 */
function exportVersionHistoryToCsv() {
  const sheet = createVersionHistorySheet();
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    SpreadsheetApp.getUi().alert('No version history to export.');
    return;
  }
  
  // Convert to CSV
  const csv = data.map(row => {
    return row.map(cell => {
      const cellStr = String(cell);
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return '"' + cellStr.replace(/"/g, '""') + '"';
      }
      return cellStr;
    }).join(',');
  }).join('\n');
  
  // Create a new spreadsheet with the CSV data for download
  const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd_HH-mm-ss');
  const fileName = 'version_history_' + timestamp + '.csv';
  
  // Create the file in Drive
  const file = DriveApp.createFile(fileName, csv, MimeType.CSV);
  const fileUrl = file.getUrl();
  
  SpreadsheetApp.getUi().alert(
    'CSV Export Complete',
    'Your version history has been exported.\n\nFile: ' + fileName + '\n\nYou can access it from your Google Drive.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Gets version history as CSV string for download via sidebar.
 * @returns {string} CSV content.
 */
function getVersionHistoryCsv() {
  const sheet = createVersionHistorySheet();
  const data = sheet.getDataRange().getValues();
  
  return data.map(row => {
    return row.map(cell => {
      const cellStr = String(cell);
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return '"' + cellStr.replace(/"/g, '""') + '"';
      }
      return cellStr;
    }).join(',');
  }).join('\n');
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Checks if credentials are configured.
 * @returns {boolean} True if credentials are configured.
 */
function hasCredentials() {
  const creds = getCredentials();
  return !!(creds.serverUrl && creds.username && creds.password);
}

/**
 * Gets the current user's email.
 * @returns {string} The user's email.
 */
function getCurrentUser() {
  return Session.getActiveUser().getEmail() || 'Unknown User';
}

/**
 * Clears all stored credentials.
 */
function clearCredentials() {
  const props = PropertiesService.getUserProperties();
  props.deleteProperty(PROPERTY_SERVER_URL);
  props.deleteProperty(PROPERTY_USERNAME);
  props.deleteProperty(PROPERTY_PASSWORD);
}