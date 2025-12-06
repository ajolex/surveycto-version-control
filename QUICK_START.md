# Quick Start - SurveyCTO Deployment Tracking

## What's New

You now have **automatic deployment logging**. When you upload a form to SurveyCTO, the extension automatically:
1. Detects the upload success
2. Extracts the form version from the page
3. Asks you to add deployment notes (optional)
4. Logs everything to your Version History sheet

**No manual copying of version numbers. No manual data entry.**

## 5-Minute Setup

### Step 1: Load the Extension
1. Open `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Navigate to: `Documents/surveycto-version-control/chrome-extension`
5. Select folder and click Open
6. Extension should show as enabled

### Step 2: Update Google Apps Script (5 seconds)
1. Open your Google Sheet
2. Click **Extensions → Apps Script**
3. In Code.gs, find the `logDeployment()` function
4. After it, add the new `logDeploymentWithVersion()` function (copy from Code.gs in the repo)
5. Click Save

Done! ✓

## How to Use

### Normal Workflow
1. **Open your Google Sheet** (keep the tab open)
2. **Go to SurveyCTO** and deploy your form as usual
3. **After success dialog**, you'll see a custom dialog from the extension
4. **(Optional) Add deployment notes** - describe what changed
5. **Click "Log Deployment"** - you're done!
6. **Check Version History sheet** - new row appears automatically

### What Gets Logged
- Form ID
- Deployed version number (from SurveyCTO)
- Your email/username
- Timestamp
- Any notes you added
- Status: "Deployed"

## That's It!

Your deployment is now tracked. No spreadsheet updates needed. No version number copying.

---

## For Your Team

Tell them:

> "Keep your Google Sheet tab open. After you deploy a form to SurveyCTO, a dialog will appear. Add optional notes about what changed, then click 'Log Deployment'. That's it - the version control is automatic."

---

## Need Help?

### Extension doesn't show dialog after upload
- [ ] Is the Google Sheet tab open in Chrome?
- [ ] Is the extension enabled? (check chrome://extensions)
- [ ] Try refreshing the SurveyCTO page
- [ ] Check F12 console for errors

### Wrong form is logged
- [ ] Check that form IDs in your Sheet match SurveyCTO
- [ ] The dialog shows the form ID - verify it's correct before clicking Log

### Can't reach Google Sheets error
- [ ] Open your Google Sheet in a tab
- [ ] Make sure it's the same browser/profile as the extension
- [ ] Don't close the Sheet tab while deploying

---

## Documents Included

1. **DEPLOYMENT_TRACKING_SETUP.md** - Complete setup guide with troubleshooting
2. **IMPLEMENTATION_SUMMARY.md** - Technical details and architecture
3. **README.md** - Original project overview

Read the full setup guide for details on troubleshooting and advanced configuration.
