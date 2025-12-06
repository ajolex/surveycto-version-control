# SurveyCTO Version Control

Automatic version tracking for SurveyCTO forms with zero manual data entry.

## What It Does

When you deploy a form to SurveyCTO, our system automatically:
1. Detects the successful deployment
2. Captures the version number from the server
3. Logs it to your Google Sheet with a timestamp
4. Records your deployment notes (optional)

**That's it. No manual copying. No manual logging. Completely automatic.**

## Quick Start (5 Minutes)

### 1. Load the Chrome Extension
1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `chrome-extension` folder
5. Done! ✓

### 2. Update Google Apps Script
1. Open your Google Sheet
2. Click **Extensions → Apps Script**
3. Find `Code.gs`
4. Add this function at the end:

```javascript
function logDeploymentWithVersion(deploymentData) {
  try {
    const sheet = createVersionHistorySheet();
    const timestamp = new Date().toISOString();
    const user = Session.getActiveUser().getEmail() || 'Unknown User';
    
    sheet.appendRow([
      deploymentData.deployedVersion || 'Unknown',
      deploymentData.formId,
      deploymentData.formName || deploymentData.formId,
      user,
      timestamp,
      deploymentData.message || '',
      'Deployed'
    ]);
    
    return { success: true, message: 'Deployment logged' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

5. Click **Save** ✓

### 3. Test It
1. Keep your Google Sheet tab open
2. Go to SurveyCTO and deploy a form (normal process)
3. After success, extension dialog appears
4. Add optional notes and click "Log Deployment"
5. Check Version History sheet - new row appears ✓

## How It Works

```
You deploy form in SurveyCTO
           ↓
Success dialog appears
           ↓
Extension detects it automatically
           ↓
Extracts form ID + version from page
           ↓
Shows dialog with form details
           ↓
User adds optional notes
           ↓
Clicks "Log Deployment"
           ↓
Version History sheet updates instantly
```

## What Gets Logged

Each deployment records:
- **Version** - From SurveyCTO's deployment info
- **Form ID** - Your form identifier
- **Form Name** - Display name from sheet
- **Deployed By** - Your email (automatic)
- **Timestamp** - When logged (automatic)
- **Message** - Your deployment notes (optional)
- **Status** - "Deployed" (automatic)

## Requirements

- ✓ Chrome browser
- ✓ Google Sheet with Google Apps Script
- ✓ SurveyCTO account
- ✓ One Google Sheet tab open while deploying

## Sheet Setup

Your Google Sheet needs two sheets:

**1. Settings Sheet** (where you track your forms)
```
| form_title | form_id | version | ... |
|------------|---------|---------|-----|
| Example Form | example | | |
| PSP Survey | scto_survey | | |
```

**2. Version History Sheet** (where deployments are logged)
```
| Version | Form ID | Form Name | Deployed By | Timestamp | Message | Status |
|---------|---------|-----------|-------------|-----------|---------|--------|
| [auto] | [auto] | [auto] | [auto] | [auto] | [optional] | [auto] |
```

The extension automatically creates Version History if it doesn't exist.

## Features

✓ **Automatic Detection** - Detects form deployments without user intervention  
✓ **Version Capture** - Gets version directly from SurveyCTO  
✓ **Zero Manual Entry** - No copying numbers or typing timestamps  
✓ **User Email** - Automatically records who deployed  
✓ **Timestamps** - All deployments timestamped automatically  
✓ **Optional Notes** - Add context to each deployment  
✓ **Audit Trail** - Complete history of all deployments  
✓ **Google Sheet Native** - Stores everything in your Sheet  

## Troubleshooting

### Extension dialog doesn't appear
- Is your Google Sheet tab open in the same browser?
- Is the extension enabled? Check `chrome://extensions/`
- Try refreshing the SurveyCTO page

### "No Google Sheets tab found" error
- Open your Google Sheet in the same browser
- Keep the tab open while deploying
- Don't close the Sheet tab during deployment

### Wrong form is being logged
- Make sure form IDs in your Settings sheet match SurveyCTO exactly
- The dialog shows the form ID before logging - verify it's correct

## File Structure

```
surveycto-version-control/
├── Code.gs                          # Google Apps Script
├── appsscript.json                  # Apps Script config
├── chrome-extension/
│   ├── manifest.json                # Extension config
│   ├── content.js                   # SurveyCTO page monitoring
│   ├── background.js                # Extension background worker
│   ├── sheets-content.js            # Google Sheets bridge
│   └── icons/                       # Extension icons
├── QUICK_START.md                   # This guide
├── DEPLOYMENT_TRACKING_SETUP.md     # Detailed setup
└── README.md                        # This file
```

## Architecture

The system consists of three parts:

1. **Content Script** (on SurveyCTO page)
   - Monitors for deployment success dialog
   - Extracts form ID and version from page
   - Shows logging dialog with form details
   
2. **Background Service Worker** (in extension)
   - Relays messages between SurveyCTO and Sheets
   - Handles cross-domain communication
   
3. **Sheets Bridge** (on Google Sheet)
   - Calls Apps Script functions
   - Logs data to Version History sheet

## For Your Team

Share this with your team:

> "Keep your Google Sheet open. Deploy forms to SurveyCTO as usual. After the success dialog, our extension automatically shows a logging dialog. Add optional notes and click Log. That's it - version control is automatic."

## Advanced

See `DEPLOYMENT_TRACKING_SETUP.md` for:
- Complete setup guide with screenshots
- Detailed troubleshooting
- Team training guide
- Technical architecture
- Testing procedures

## Support

If something doesn't work:
1. Check F12 console for errors (F12 → Console tab)
2. Verify Google Sheet is open in the same browser
3. Check extension is enabled: `chrome://extensions/`
4. Try disabling and re-enabling the extension
5. Clear extension data: `chrome://extensions/` → SurveyCTO → Clear data

## Technical Details

- **Extension Type:** Chrome Extension (Manifest V3)
- **Apps Script Version:** V8 runtime or later
- **Communication:** Native Chrome messaging API
- **Storage:** Google Sheet with Apps Script
- **Security:** Uses google.script.run (secure API)

## Limitations

- Requires Google Sheet tab to be open during deployment
- Only logs deployments from this browser/profile
- Manual form upload to SurveyCTO still required (no API available)
- Version numbers come from SurveyCTO's server

## Next Steps

1. **Quick Start** - Follow the 5-minute setup above
2. **Test** - Try with one form deployment
3. **Team Training** - Show your team how to use it
4. **Deploy** - Use normally and watch Version History grow

---

**Ready to deploy?** Start with the 5-minute setup above!

Need more help? See `DEPLOYMENT_TRACKING_SETUP.md` for the complete guide.
