/**
 * SurveyCTO Version Control - Google Apps Script Add-on
 * 
 * Handles deployment logging, direct Google Sheets deployment to SurveyCTO,
 * and version history management.
 */

// ============================================
// CONSTANTS
// ============================================
const VERSION_HISTORY_SHEET_NAME = 'Version History';
const PROPERTY_SERVER_URL = 'surveycto_server_url';
const PROPERTY_USERNAME = 'surveycto_username';
const PROPERTY_PASSWORD = 'surveycto_password';

// ============================================
// MENU & UI
// ============================================

function onOpen() {
  SpreadsheetApp.getUi().createMenu('SurveyCTO Version Control')
    .addItem('🚀 Deploy Form', 'showDeployPopup')
    .addItem('Open Sidebar', 'showSidebar')
    .addSeparator()
    .addItem('View Version History', 'showVersionHistory')
    .addItem('Export History to CSV', 'exportVersionHistoryToCsv')
    .addSeparator()
    .addItem('Settings', 'showSettingsDialog')
    .addToUi();
}

function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar').setTitle('SurveyCTO Version Control').setWidth(300);
  SpreadsheetApp.getUi().showSidebar(html);
}

function showDeployPopup() {
  const html = HtmlService.createHtmlOutputFromFile('DeployPopup').setWidth(500).setHeight(450);
  SpreadsheetApp.getUi().showModalDialog(html, 'Deploy to SurveyCTO');
}

function showDeployDialog() {
  const html = HtmlService.createHtmlOutputFromFile('Dialog').setWidth(450).setHeight(350);
  SpreadsheetApp.getUi().showModalDialog(html, 'Deploy Form');
}

function showSettingsDialog() {
  const html = HtmlService.createHtmlOutputFromFile('Settings').setWidth(450).setHeight(400);
  SpreadsheetApp.getUi().showModalDialog(html, 'Settings');
}

function showVersionHistory() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(VERSION_HISTORY_SHEET_NAME) || createVersionHistorySheet();
  ss.setActiveSheet(sheet);
}

// ============================================
// FORM DETECTION
// ============================================

function getFormDetailsFromSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  let settingsSheet = null;
  
  for (let i = 0; i < sheets.length; i++) {
    const name = sheets[i].getName().toLowerCase();
    if (name === 'settings' || name === 'setting') {
      settingsSheet = sheets[i];
      break;
    }
  }
  
  if (!settingsSheet) return { found: false, error: 'No Settings sheet found.' };
  
  const displayValues = settingsSheet.getDataRange().getDisplayValues();
  if (displayValues.length < 2) return { found: false, error: 'Settings sheet has no data.' };
  
  const headers = displayValues[0].map(h => String(h).toLowerCase().trim());
  const values = displayValues[1];
  
  const formIdIndex = headers.findIndex(h => h === 'form_id' || h === 'formid');
  const formTitleIndex = headers.findIndex(h => h === 'form_title' || h === 'title');
  const versionIndex = headers.findIndex(h => h === 'version');
  
  const formId = formIdIndex >= 0 ? String(values[formIdIndex]).trim() : '';
  const formTitle = formTitleIndex >= 0 ? String(values[formTitleIndex]).trim() : formId;
  const version = versionIndex >= 0 ? String(values[versionIndex]).trim() : '';
  
  if (!formId) return { found: false, error: 'No form_id found in Settings sheet.' };
  
  return { found: true, formId, formTitle, version };
}

function getFreshFormDetailsForDeployment() {
  const details = getFormDetailsFromSpreadsheet();
  if (!details.found) return { success: false, error: details.error };
  return { success: true, ...details, capturedAt: new Date().toISOString() };
}

function getCurrentFormInfo() {
  return {
    spreadsheet: getFormDetailsFromSpreadsheet(),
    spreadsheetName: SpreadsheetApp.getActiveSpreadsheet().getName(),
    spreadsheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl()
  };
}

// ============================================
// VERSION HISTORY
// ============================================

function createVersionHistorySheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(VERSION_HISTORY_SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(VERSION_HISTORY_SHEET_NAME);
    const headers = ['Version', 'Form ID', 'Form Name', 'Deployed By', 'Timestamp', 'Message', 'Status'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers])
      .setFontWeight('bold').setBackground('#4285f4').setFontColor('white');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getLastVersion(formId) {
  const sheet = createVersionHistorySheet();
  const data = sheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][1] === formId) return data[i][0];
  }
  return 'None';
}

function logDeployment(deployment) {
  const sheet = createVersionHistorySheet();
  const version = deployment.version || 'Unknown';
  const timestamp = new Date().toISOString();
  const user = Session.getActiveUser().getEmail() || 'Unknown User';
  
  sheet.appendRow([version, deployment.formId, deployment.formName, user, timestamp, deployment.message, deployment.status || 'Pending']);
  
  return { version, formId: deployment.formId, formName: deployment.formName, deployedBy: user, timestamp, message: deployment.message, status: deployment.status };
}

function updateDeploymentStatus(formId, status) {
  const sheet = createVersionHistorySheet();
  const data = sheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][1] === formId) {
      sheet.getRange(i + 1, 7).setValue(status);
      return;
    }
  }
}

function getVersionHistory(limit) {
  const sheet = createVersionHistorySheet();
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const history = [];
  const startRow = Math.max(1, data.length - (limit || 10));
  for (let i = data.length - 1; i >= startRow; i--) {
    history.push({ version: data[i][0], formId: data[i][1], formName: data[i][2], deployedBy: data[i][3], timestamp: data[i][4], message: data[i][5], status: data[i][6] });
  }
  return history;
}

// ============================================
// CREDENTIALS
// ============================================

function getCredentials() {
  const props = PropertiesService.getUserProperties();
  return {
    serverUrl: props.getProperty(PROPERTY_SERVER_URL) || '',
    username: props.getProperty(PROPERTY_USERNAME) || '',
    password: props.getProperty(PROPERTY_PASSWORD) || ''
  };
}

function saveCredentials(credentials) {
  const props = PropertiesService.getUserProperties();
  if (credentials.serverUrl !== undefined) props.setProperty(PROPERTY_SERVER_URL, credentials.serverUrl);
  if (credentials.username !== undefined) props.setProperty(PROPERTY_USERNAME, credentials.username);
  if (credentials.password !== undefined) props.setProperty(PROPERTY_PASSWORD, credentials.password);
}

function testConnection() {
  const creds = getCredentials();
  if (!creds.serverUrl || !creds.username || !creds.password) {
    return { success: false, message: 'Please configure all credentials first.' };
  }
  
  try {
    const serverUrl = normalizeServerUrl(creds.serverUrl);
    const response = UrlFetchApp.fetch(serverUrl, { method: 'get', followRedirects: false, muteHttpExceptions: true });
    const code = response.getResponseCode();
    
    if (code === 200 || code === 301 || code === 302 || code === 403) {
      return { success: true, message: 'Server is reachable!' };
    }
    return { success: false, message: 'Server not found or unexpected response: ' + code };
  } catch (error) {
    return { success: false, message: 'Connection error: ' + error.message };
  }
}

function hasCredentials() {
  const creds = getCredentials();
  return !!(creds.serverUrl && creds.username && creds.password);
}

function clearCredentials() {
  const props = PropertiesService.getUserProperties();
  props.deleteProperty(PROPERTY_SERVER_URL);
  props.deleteProperty(PROPERTY_USERNAME);
  props.deleteProperty(PROPERTY_PASSWORD);
}

// ============================================
// ONE-CLICK DEPLOY (DIRECT GOOGLE SHEETS)
// ============================================

/**
 * Gets data needed for the deploy popup.
 * Includes spreadsheet URL for direct Google Sheets deployment.
 */
function getDeployPopupData() {
  const formDetails = getFreshFormDetailsForDeployment();
  const creds = getCredentials();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (!formDetails.success) {
    return { success: false, error: formDetails.error };
  }
  
  return {
    success: true,
    formId: formDetails.formId,
    formTitle: formDetails.formTitle,
    version: formDetails.version,
    serverUrl: normalizeServerUrl(creds.serverUrl),
    spreadsheetId: ss.getId(),
    spreadsheetUrl: ss.getUrl(),
    spreadsheetName: ss.getName()
  };
}

/**
 * Logs the deployment and returns info for opening SurveyCTO.
 */
function logAndOpenDeploy(deployData) {
  try {
    const logged = logDeployment({
      formId: deployData.formId,
      formName: deployData.formName || deployData.formId,
      version: deployData.version,
      message: deployData.message,
      status: 'Pending - Deploy in SurveyCTO'
    });
    
    return {
      success: true,
      version: logged.version,
      message: 'Deployment logged. Complete in SurveyCTO console.',
      deployment: logged
    };
  } catch (error) {
    return { success: false, message: 'Failed to log: ' + error.message };
  }
}

/**
 * Downloads the spreadsheet as XLSX (fallback option).
 */
function downloadFormAsXlsx() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const formDetails = getFormDetailsFromSpreadsheet();
  const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss');
  const filename = (formDetails.formId || 'form') + '_' + timestamp + '.xlsx';
  
  const xlsxUrl = 'https://docs.google.com/spreadsheets/d/' + ss.getId() + '/export?format=xlsx';
  const xlsxBlob = UrlFetchApp.fetch(xlsxUrl, { headers: { 'Authorization': 'Bearer ' + ScriptApp.getOAuthToken() } }).getBlob().setName(filename);
  const file = DriveApp.createFile(xlsxBlob);
  
  SpreadsheetApp.getUi().alert('Form Ready', 'File: ' + filename + '\nDrive URL: ' + file.getUrl(), SpreadsheetApp.getUi().ButtonSet.OK);
  return { success: true, filename, url: file.getUrl() };
}

// ============================================
// EXPORT
// ============================================

function exportVersionHistoryToCsv() {
  const sheet = createVersionHistorySheet();
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) { SpreadsheetApp.getUi().alert('No history to export.'); return; }
  
  const csv = data.map(row => row.map(cell => {
    const s = String(cell);
    return (s.includes(',') || s.includes('"') || s.includes('\n')) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }).join(',')).join('\n');
  
  const fileName = 'version_history_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd_HH-mm-ss') + '.csv';
  DriveApp.createFile(fileName, csv, MimeType.CSV);
  SpreadsheetApp.getUi().alert('Exported: ' + fileName);
}

function getVersionHistoryCsv() {
  const sheet = createVersionHistorySheet();
  return sheet.getDataRange().getValues().map(row => row.map(cell => {
    const s = String(cell);
    return (s.includes(',') || s.includes('"') || s.includes('\n')) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }).join(',')).join('\n');
}

// ============================================
// UTILITY
// ============================================

function getCurrentUser() {
  return Session.getActiveUser().getEmail() || 'Unknown User';
}

function normalizeServerUrl(url) {
  if (!url) return '';
  let cleanUrl = url.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
  if (!cleanUrl.endsWith('.surveycto.com')) cleanUrl += '.surveycto.com';
  return 'https://' + cleanUrl;
}

function getForms() { return []; }

function deployForm(formData) {
  const logged = logDeployment({
    formId: formData.formId,
    formName: formData.formName || formData.formId,
    version: formData.version,
    message: formData.message,
    status: 'Logged (Use 🚀 Deploy Form)'
  });
  return { success: true, message: 'Use the "🚀 Deploy Form" menu for direct deployment.', version: logged.version, requiresManualDeploy: true };
}