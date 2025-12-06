# Solution 2: Chrome Extension Implementation Guide

## Overview

**Solution 2** implements true one-click form deployment through a Chrome extension that automatically uploads forms to SurveyCTO without requiring manual file drag-and-drop.

**Key Features:**
- ✅ One-click deployment from Google Sheets
- ✅ Automatic XLSX file generation
- ✅ Automatic SurveyCTO console opening
- ✅ Automatic file upload and form submission
- ✅ Automatic deployment logging
- ✅ Zero manual steps (except installation)

---

## File Structure

```
chrome-extension/
├── manifest.json           # Extension configuration
├── background.js           # Service worker (handles messaging)
├── content.js             # Content script (runs on SurveyCTO console)
├── popup.html             # Extension icon popup
├── popup.js               # Popup functionality
├── options.html           # Settings page
├── options.js             # Settings functionality
└── icons/
    ├── icon-16.png        # Small icon
    ├── icon-48.png        # Medium icon
    └── icon-128.png       # Large icon
```

---

## Part 1: Extension Installation & Setup

### Step 1: Prepare Extension Files

1. **Create a new folder** on your computer:
   ```
   C:\Users\[YourUsername]\Documents\surveycto-version-control\chrome-extension
   ```

2. **Download/Copy all extension files** from the repository:
   - `manifest.json`
   - `background.js`
   - `content.js`
   - `popup.html`
   - `popup.js`
   - `options.html`
   - `options.js`
   - `icons/` folder with 3 PNG icons

3. **Create placeholder icons** (optional):
   If icons are missing, create 16x16, 48x48, and 128x128 PNG files and save them in the `icons/` folder. You can use any simple image or placeholder.

### Step 2: Load Extension in Chrome

1. **Open Chrome DevTools for Extensions**:
   - Go to `chrome://extensions/` in your browser
   - OR: Click menu → **More tools** → **Extensions**

2. **Enable Developer Mode**:
   - Toggle "Developer mode" in the top-right corner

3. **Load the unpacked extension**:
   - Click "Load unpacked" button
   - Browse to your `chrome-extension` folder
   - Click "Select Folder"

4. **Verify Installation**:
   - You should see "SurveyCTO Form Uploader" in the extensions list
   - Note the extension ID (will look like: `kbnfdiejlkdnofaflcj...`)
   - You should see an icon in the Chrome toolbar

### Step 3: Configure Extension Options

1. **Click the extension icon** in Chrome toolbar (top-right)
2. **Click the popup menu** → **⚙️ Options**
3. **Configure settings**:
   - **Auto-submit form**: ☑ Checked (recommended)
   - **Upload timeout**: 30 seconds
   - **Debug logging**: Unchecked (check if troubleshooting)
4. **Click "💾 Save Options"**

### Step 4: Verify Extension Detects SurveyCTO Console

1. **Go to your SurveyCTO console**:
   - Navigate to `https://[yourorg].surveycto.com/console`
   - Log in if needed

2. **Check extension icon**:
   - The extension icon should be highlighted/active in the toolbar

3. **Check content script loaded**:
   - Open Chrome DevTools (F12)
   - Go to **Console** tab
   - You should see: `[Content Script] Loaded on SurveyCTO console`

---

## Part 2: Google Apps Script Integration

### Step 1: Update Code.gs

The `Code.gs` file has been updated with 3 new functions for extension integration:

1. **`generateFormXlsxForExtension()`**
   - Generates XLSX file
   - Encodes to base64 for transfer
   - Returns filename and file data

2. **`initiateExtensionDeploy(deployData)`**
   - Logs deployment to Version History
   - Returns logged deployment info

3. **`completeDeployment(formId)`**
   - Updates status to "Completed"
   - Called after extension confirms upload

**These are already included** in the updated `Code.gs`. No manual changes needed.

### Step 2: Update DeployPopup.html

The deployment popup has been completely redesigned:

1. **Now shows extension detection**:
   - If extension is available → shows green "Solution 2" message
   - If extension is NOT available → shows warning message

2. **Updated workflow**:
   - User clicks "Deploy with Extension"
   - File is generated
   - Deployment is logged
   - File is sent to extension
   - Extension handles upload automatically

**This is already included** in the updated `DeployPopup.html`. No manual changes needed.

### Step 3: Deploy Updated Apps Script

1. **Save all files** in Apps Script editor (Ctrl+S)
2. **Refresh your Google Sheet** (F5)
3. **Check that menu appears**:
   - Go to **SurveyCTO Version Control** menu
   - Should show "🚀 Deploy Form" option

---

## Part 3: First-Time Deployment Test

### Prerequisites Check

- ✅ Chrome extension installed and enabled
- ✅ Settings configured in extension options
- ✅ Google Sheet has Settings sheet with form_id
- ✅ SurveyCTO credentials configured in add-on Settings
- ✅ Apps Script code updated

### Test Deployment

1. **Open your Google Sheet**

2. **Click SurveyCTO Version Control → Deploy Form**

3. **Deployment popup appears**:
   - You should see: "✨ Solution 2: Auto-upload via Chrome extension..."
   - If you see: "⚠️ Chrome extension not detected..." → Extension not properly installed

4. **Enter deployment message**:
   - Example: "Test deployment from extension"

5. **Click "🚀 Deploy with Extension"**

6. **Watch the status messages**:
   - "📄 File generated. Sending to extension..."
   - "✅ Deployment logged. Extension will now upload..."
   - "✅ Extension will now upload..."
   - "🌐 SurveyCTO opening..."

7. **Extension automatically**:
   - Opens SurveyCTO console in a new tab
   - Uploads the XLSX file
   - Submits the form

8. **Dialog closes automatically** after upload completes

9. **Check Version History**:
   - Click **SurveyCTO Version Control** → **View Version History**
   - New deployment should appear with status "Completed"

---

## Part 4: How It Works (Technical Details)

### Message Flow Diagram

```
Google Sheets (Apps Script)
         ↓
    [Click Deploy]
         ↓
    generateFormXlsxForExtension()
         ↓
    File sent to DeployPopup.html (base64)
         ↓
    DeployPopup.html converts base64 → Blob
         ↓
    chrome.runtime.sendMessage() to extension
         ↓
Extension Background Script (background.js)
         ↓
    Stores file + metadata
    Opens new SurveyCTO tab
         ↓
Extension Content Script (content.js)
    Waits for SurveyCTO console to load
         ↓
    Receives upload command from background
         ↓
    Finds file input element
    Sets file input to uploaded file
    Triggers change event
         ↓
    Finds submit button
    Clicks submit button
         ↓
    Notifies background of completion
         ↓
Back to Google Sheets
         ↓
completeDeployment() updates status
```

### Key Components

**manifest.json**
- Defines permissions, content scripts, and background service worker
- Specifies that content script runs on `https://*.surveycto.com/console*`

**background.js** (Service Worker)
- Listens for messages from Apps Script and content script
- Manages tab creation and file passing
- Coordinates upload flow

**content.js** (Content Script)
- Runs on SurveyCTO console pages
- Detects when page is ready
- Auto-fills file input
- Clicks submit button
- Notifies background of completion

**DeployPopup.html/JS**
- Detects if extension is available
- Communicates with extension via `chrome.runtime.sendMessage()`
- Shows real-time status updates

---

## Part 5: Troubleshooting

### Issue: "Chrome extension not detected"

**Cause**: Extension not installed or not loaded properly

**Solutions**:
1. Check `chrome://extensions/` - is extension listed?
2. If not listed, go to **Load unpacked** and select the chrome-extension folder
3. Enable the extension (toggle switch should be ON)
4. Reload Google Sheet (F5)
5. Try deploying again

### Issue: Extension icon doesn't activate on SurveyCTO console

**Cause**: Content script didn't load

**Solutions**:
1. Open SurveyCTO console: `https://[yourorg].surveycto.com/console`
2. Open Chrome DevTools (F12)
3. Go to **Console** tab
4. Look for: `[Content Script] Loaded on SurveyCTO console`
5. If missing:
   - Go to `chrome://extensions/`
   - Refresh the extension (reload icon)
   - Refresh SurveyCTO console
   - Check console again

### Issue: File uploads but form doesn't submit

**Cause**: Submit button not found or not clicked

**Solutions**:
1. Open DevTools on SurveyCTO console (F12)
2. Go to **Console** tab
3. Look for: `[Content Script] Clicking submit button`
4. If not present:
   - SurveyCTO UI may have changed
   - Check if button text changed (Deploy, Upload, Submit, Continue)
   - Report issue with SurveyCTO version info
5. Manually submit form if button not found

### Issue: Extension can't find file input

**Cause**: SurveyCTO console HTML structure changed

**Solutions**:
1. Open SurveyCTO console in Chrome
2. Right-click on file upload area → **Inspect**
3. Look for `<input type="file">` element
4. Note the ID or class name
5. If structure is different, content.js needs updating
6. Report issue with screenshot of DevTools

### Issue: Deployment logged but upload didn't happen

**Cause**: Extension received message but didn't execute

**Solutions**:
1. Check DevTools **Console** on SurveyCTO tab:
   - Look for `[Content Script]` messages
   - Look for `[Background]` messages
2. Check chrome://extensions/ DevTools:
   - Click "Inspect views: service_worker"
   - Check console for errors
3. Verify extension has permission for SurveyCTO domain
4. Manually upload file and close dialog

### Issue: Extension appears to hang

**Cause**: Script waiting for page element that doesn't exist

**Solutions**:
1. Open SurveyCTO console tab
2. Manually upload file (drag-drop)
3. Click submit button
4. Check DevTools console for errors
5. Note the button text/ID and report to developer

### Debugging Mode

**Enable detailed logging**:
1. Click extension icon → **⚙️ Options**
2. Check **"Enable debug logging"**
3. Save
4. Open DevTools on SurveyCTO console
5. Check **Console** tab for verbose output

---

## Part 6: Distributing to Team Members

If you want others to use this extension:

### Option A: Manual Installation (Per User)
1. Give each user the `chrome-extension` folder
2. Have them follow **Part 1: Extension Installation & Setup**
3. Each user loads the unpacked extension on their own machine

### Option B: Publish to Chrome Web Store (Advanced)
1. Create a Google account for the organization
2. Register as a Chrome Developer
3. Upload extension to Chrome Web Store
4. Share the extension URL with team members
5. They click "Add to Chrome" to install

**For now, Option A is simpler.** Option B is recommended long-term.

### Distribution Checklist

- ✅ All extension files in `chrome-extension/` folder
- ✅ Icons properly sized (16x16, 48x48, 128x128)
- ✅ manifest.json has correct permissions
- ✅ Test locally before distributing
- ✅ Create quick-start guide for team (see **Quick Start** section below)

---

## Quick Start for End Users

Share this with team members:

### Installation (First Time Only)

1. **Get the extension folder** from your IT contact
2. **Open `chrome://extensions/`** in Chrome
3. **Turn on "Developer mode"** (top-right toggle)
4. **Click "Load unpacked"**
5. **Select the `chrome-extension` folder**
6. **Done!** You should see the extension icon in your toolbar

### Using the Extension

1. **Open Google Sheet** with SurveyCTO add-on
2. **Click SurveyCTO Version Control → Deploy Form**
3. **Enter deployment message** (e.g., "Added new questions")
4. **Click "Deploy with Extension"**
5. **Wait 10-30 seconds**
6. **Done!** Form is uploaded and logged automatically

### If Something Goes Wrong

1. **Extension not detected**?
   - Reload the extension: `chrome://extensions/` → Refresh
   - Reload Google Sheet (F5)
   - Try again

2. **Upload hangs**?
   - Open SurveyCTO console tab manually
   - Upload file yourself (drag-drop)
   - Click submit button

3. **Still stuck**?
   - Contact your IT support with error message from DevTools

---

## File Details Reference

### manifest.json
- **manifest_version**: 3 (latest Chrome extension format)
- **permissions**: storage, tabs, webRequest
- **host_permissions**: `https://*.surveycto.com/*`
- **content_scripts**: Runs on SurveyCTO console pages

### background.js
- **UPLOAD_FORM**: Initiates upload, opens SurveyCTO tab
- **CHECK_PAGE_READY**: Content script signals page is ready
- **PERFORM_UPLOAD**: Sends file to content script
- **UPLOAD_COMPLETE**: Content script confirms upload done

### content.js
- **Initialization**: Waits for DOM and SurveyCTO UI to load
- **File Upload**: Converts blob to File, fills input element
- **Form Submission**: Finds and clicks submit button
- **Notifications**: Reports back to background script

### DeployPopup.html
- **Extension Detection**: Checks if chrome.runtime is available
- **File Generation**: Calls Apps Script to generate XLSX
- **File Transfer**: Converts base64 back to blob, sends to extension
- **Status Tracking**: Shows real-time status messages

---

## Updating the Extension

If SurveyCTO changes their console UI:

### Find What Changed
1. Open SurveyCTO console
2. Right-click file upload area → **Inspect**
3. Look for `<input type="file">` element
4. Note the ID or class name
5. Look for submit button attributes

### Update content.js
Edit `content.js` selectors:
```javascript
// In findFileInput() function, add new selector
const selectors = [
  'input[type="file"]',
  'input[id="newIdFromSurveyCTO"]',  // Add this
  // ... other selectors
];

// In submitForm() function, add new selector
for (let btn of buttons) {
  const text = btn.textContent.toLowerCase();
  if (text.includes('deploy') || text.includes('newButtonTextFromSurveyCTO')) {
    // Will match
  }
}
```

### Test
1. Reload extension: `chrome://extensions/` → Refresh
2. Try deployment again
3. Check DevTools for errors

---

## Limitations & Known Issues

### Browser Compatibility
- **Only works on Chrome/Chromium browsers**
- Does NOT work on Firefox, Safari, or Edge (would need separate extensions)

### Security Considerations
- Extension has permission to read SurveyCTO pages
- Deployment logs stored in Google Sheets (standard)
- File is sent via chrome.runtime messaging (secure)
- No credentials sent to extension (uses SurveyCTO session)

### SurveyCTO Compatibility
- Works with SurveyCTO 4.x and later
- May need updates if SurveyCTO major UI changes
- Contact support if form submission isn't detected

### Performance
- Upload typically takes 10-30 seconds
- Depends on file size and network speed
- Extension runs in background (doesn't block user)

---

## Next Steps

1. **Install the extension** (Part 1-3)
2. **Test with a form** (Part 3)
3. **Verify Version History** shows "Completed" status
4. **Distribute to team** (Part 6)
5. **Share Quick Start guide** with team members

---

## Support & Troubleshooting

If you encounter issues:

1. **Check DevTools Console**:
   - Open SurveyCTO console
   - Press F12 → **Console** tab
   - Look for `[Content Script]` or `[Background]` messages

2. **Check Extension DevTools**:
   - Go to `chrome://extensions/`
   - Click "Inspect views: service_worker" on extension
   - Check console for errors

3. **Enable Debug Logging**:
   - Extension Options → Check "Enable debug logging"
   - Refresh and try deployment again
   - Check console for detailed messages

4. **Test Individual Components**:
   - Can you manually upload to SurveyCTO? (If no → SurveyCTO issue)
   - Does extension icon appear on console? (If no → content script issue)
   - Does DevTools show [Content Script] messages? (If no → script not running)

5. **Report Issues**:
   - Include version info (Chrome version, SurveyCTO version)
   - Include full DevTools error messages
   - Include screenshots of what you see

---

## Summary

Solution 2 provides **true one-click automation** with minimal setup:

✅ **Install extension** (one-time)
✅ **Click Deploy** from Google Sheets
✅ **Auto-upload, auto-log, auto-complete**
✅ **Works every time** (when SurveyCTO UI doesn't change)

It's the most automated solution possible within Chrome extension constraints.

