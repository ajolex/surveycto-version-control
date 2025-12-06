# SurveyCTO Version Control - Deployment Tracking Setup Guide

## Overview

This system automatically logs SurveyCTO form deployments to your Google Sheet's Version History tab. When you deploy a form to SurveyCTO, the Chrome extension detects the success message, extracts the form version, and prompts you to add deployment notes - all of which are automatically recorded.

## How It Works

### The Workflow

1. **You deploy a form in SurveyCTO** → Click the "+" button → "Upload form definition" → Select your form XLSX → Click Upload
2. **Success dialog appears** → "Form uploaded successfully"
3. **Extension detects the dialog** and extracts:
   - Form ID from the page
   - Deployed version number from the page
4. **Extension shows a dialog** asking for optional deployment notes
5. **You click "Log Deployment"** → Form ID, version, timestamp, and notes are logged to Version History sheet
6. **Done!** Your Google Sheet automatically updates with the deployment info

### No Manual Logging Needed
- No copying version numbers
- No manual typing into sheets
- Just deploy and confirm - the rest is automatic

## Setup Instructions

### 1. Verify Google Sheets Tab is Open
Keep your "SurveyCTO Version Control" Google Sheet open in a browser tab. The extension needs access to this tab to log deployments.

### 2. Deploy as Normal
Go to your SurveyCTO server Design page:
- `https://your-server.surveycto.com/main.html#Design`

### 3. Click the "+" Button and Upload Form
- Click "+" to add a new form
- Select "Upload form definition"
- Choose your XLSX file
- Click Upload

### 4. Wait for Success Dialog
After uploading, SurveyCTO will show: "Form uploaded successfully"

### 5. Fill in Deployment Notes (Optional)
A dialog from the extension will appear showing:
```
Form ID: example
Version: 2512061732
```

Add optional notes like:
- "Fixed calculation error in Q5"
- "Added new attachment requirement"
- "Version for client review"

### 6. Click "Log Deployment"
The extension will:
- Record the form ID, version, timestamp, and notes
- Add a new row to your Version History sheet
- Show "✓ Logged Successfully"

## What Gets Logged

Each deployment records:
| Column | Value |
|--------|-------|
| Version | 2512061732 |
| Form ID | example |
| Form Name | example |
| Deployed By | your.email@domain.com |
| Timestamp | 2025-12-06T14:32:45.123Z |
| Message | Your deployment notes |
| Status | Deployed |

## Troubleshooting

### "Dialog doesn't appear after upload"
- Make sure the Google Sheets tab is open in the same browser
- Check that the extension is enabled in Chrome
- Wait a few seconds after the success dialog - the extension needs time to detect it

### "Error: No Google Sheets tab found"
- Open your "SurveyCTO Version Control" sheet
- Keep it in a browser tab while deploying
- The extension needs to be able to reach this tab to log data

### "Form ID doesn't match"
- The extension tries to match the deployed form to your settings sheet
- If it can't find an exact match, it uses the most recent form shown on the page
- Make sure your form IDs in the settings sheet match what's shown in SurveyCTO

### "Version number is wrong"
- The version comes from SurveyCTO's "Deployed version:" field
- Make sure you're looking at the correct form in the list
- If you deployed a new form, it should be near the bottom of the list

## What the Extension Does NOT Do

The extension only handles **logging after deployment**. It does NOT:
- Upload forms automatically
- Modify your form files
- Change SurveyCTO settings
- Access your form data/responses
- Upload to multiple servers

You still manually:
- Upload the form file to SurveyCTO
- Click the upload button
- Confirm the success dialog

The extension just watches for this and logs the details automatically.

## Files Modified/Created

### Google Apps Script (Code.gs)
- `getAllFormIds()` - Returns list of form IDs from settings sheet
- `logDeploymentWithVersion()` - Logs deployment with version number to Version History

### Chrome Extension Files

**New Files:**
- `sheets-content.js` - Bridges communication between extension and Apps Script
- `apps-script-bridge.js` - Helper for calling Apps Script functions (optional)

**Modified Files:**
- `content.js` - Completely rewritten to detect success dialog and show logging dialog
- `background.js` - Updated to handle new message types
- `manifest.json` - Added Google Sheets content script

## Testing the Setup

1. Open your Google Sheet and Version History tab
2. Go to your SurveyCTO server
3. Deploy a test form
4. Wait for the extension dialog to appear
5. Enter test notes like "Test deployment"
6. Click "Log Deployment"
7. Check your Version History sheet - new row should appear

## Important Notes

⚠️ **Keep Google Sheets Open**
- The extension communicates with Apps Script through the Google Sheets tab
- Keep at least one tab with your Sheet open while deploying forms
- You don't need to keep it active/visible, just open in a tab

✓ **Form IDs Matter**
- Make sure form IDs in your Settings sheet match SurveyCTO form IDs exactly
- The extension uses this to match the deployed form
- If no match is found, it uses the most recent form shown

✓ **Version Numbers**
- Version numbers come directly from SurveyCTO's display
- Format: 10-digit timestamp (e.g., 2512061732)
- Represents when the form was last deployed

## Next Steps

1. **Test the setup** with a non-critical form first
2. **Verify Version History** shows correct data
3. **Adjust notes template** if needed
4. **Train team** on the new workflow
5. **Set up regular deployments** with automatic logging

## Support

If you encounter issues:
1. Check that Google Sheets tab is open
2. Check Chrome Console (F12) for error messages
3. Verify form IDs match between Sheet and SurveyCTO
4. Try disabling and re-enabling the extension
5. Check extension permissions in Chrome settings
