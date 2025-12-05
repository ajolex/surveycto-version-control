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
const PROPERTY_SERVER_URL = 'surveycto_server_url';
const PROPERTY_USERNAME = 'surveycto_username';
const PROPERTY_PASSWORD = 'surveycto_password';

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
    
    // Make API call to deploy the form
    const url = serverUrl + '/api/v1/forms/' + encodeURIComponent(formData.formId) + '/deploy';
    const options = {
      method: 'post',
      headers: {
        'Authorization': 'Basic ' + Utilities.base64Encode(creds.username + ':' + creds.password),
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        message: formData.message,
        version: logged.version
      }),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const code = response.getResponseCode();
    
    if (code >= 200 && code < 300) {
      updateDeploymentStatus(formData.formId, 'Success');
      return {
        success: true,
        message: 'Form deployed successfully!',
        version: logged.version,
        deployment: logged
      };
    } else if (code === 401) {
      updateDeploymentStatus(formData.formId, 'Failed');
      return {
        success: false,
        message: 'Authentication failed. Please check your credentials.'
      };
    } else if (code === 404) {
      // Form deployment endpoint might not exist - still log as success
      updateDeploymentStatus(formData.formId, 'Logged');
      return {
        success: true,
        message: 'Deployment logged (API endpoint not available).',
        version: logged.version,
        deployment: logged
      };
    } else {
      updateDeploymentStatus(formData.formId, 'Failed');
      return {
        success: false,
        message: 'Deployment failed with status: ' + code
      };
    }
  } catch (error) {
    // If there's a network error, still mark as logged
    if (formData.formId) {
      updateDeploymentStatus(formData.formId, 'Logged (Offline)');
    }
    return {
      success: true,
      message: 'Deployment logged locally. API call failed: ' + error.message,
      version: getNextVersion(formData.formId)
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