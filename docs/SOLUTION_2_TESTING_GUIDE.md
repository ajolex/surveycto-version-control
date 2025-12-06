# Solution 2: Testing & Verification Guide

## Your SurveyCTO Server Info

**Server**: pspsicm.surveycto.com  
**Home**: https://pspsicm.surveycto.com/main.html  
**Design/Upload Tab**: https://pspsicm.surveycto.com/main.html#Design  

The extension has been updated to work with your server's URL structure.

---

## Extension Updates Made

The following files were updated to work with `main.html#Design` instead of `/console`:

✅ **manifest.json**
- Updated content script to match: `https://*.surveycto.com/main.html*`

✅ **background.js**
- Updated to open: `https://pspsicm.surveycto.com/main.html#Design`

✅ **content.js**
- Updated to detect Design page readiness
- Updated console messages to reference "Design page" instead of "console"

---

## Step-by-Step Test

### 1. Reload Extension in Chrome

1. Go to `chrome://extensions/`
2. Find "SurveyCTO Form Uploader"
3. Click the **Refresh** icon (circular arrow)
4. You should see: "Reloaded extension"

### 2. Verify Design Page Detection

1. Navigate to: https://pspsicm.surveycto.com/main.html#Design
2. Open Chrome DevTools (F12)
3. Go to **Console** tab
4. Look for: `[Content Script] Loaded on SurveyCTO Design page`
5. Extension icon should be active/highlighted in toolbar

**If you see this message → Content script is working!**

### 3. Test First Deployment

1. **Open Google Sheet** with SurveyCTO add-on
2. **Click SurveyCTO Version Control → Deploy Form**
3. **Verify extension detection**:
   - Should see: "✨ Solution 2: Auto-upload via Chrome extension"
   - If warning appears → Extension not detected, reload it
4. **Enter deployment message** (e.g., "Test with updated extension")
5. **Click "Deploy with Extension"**
6. **Watch what happens**:
   - Dialog shows: "📄 File generated"
   - Dialog shows: "✅ Deployment logged"
   - Dialog shows: "📤 Extension uploading"
   - Dialog shows: "🌐 SurveyCTO opening..."
   - **New tab opens with** https://pspsicm.surveycto.com/main.html#Design
7. **Wait 10-30 seconds** for auto-upload to complete
8. **Dialog should show**: "✅ Deployment complete"
9. **Dialog closes automatically**

### 4. Verify in SurveyCTO

In the new tab that opened:

1. Check if your file was uploaded
2. Look for a new form or updated version
3. Check the **Design** section for recent uploads

### 5. Verify in Version History

Back in Google Sheets:

1. Click **SurveyCTO Version Control → View Version History**
2. Newest entry should show:
   - Status: **"Completed"** ✅
   - Your deployment message
   - Today's timestamp
   - Your email

---

## What to Look For in DevTools

### Console Tab (F12 → Console)

**You should see these messages** in order:

```
[Content Script] Loaded on SurveyCTO Design page
[Content Script] Page ready signal sent
[Content Script] Starting auto-upload for: [filename]
[Content Script] Found file input: input[type="file"]
[Content Script] File input filled with: form_20251206_143022.xlsx
[Content Script] Attempting to submit form...
[Content Script] Found submit button: Upload
[Content Script] Clicking submit button
```

**If you DON'T see these messages:**
- Content script didn't load
- Design page URL different
- SurveyCTO UI structure changed

### Network Tab (F12 → Network)

You should see:
- POST request to `https://pspsicm.surveycto.com/...` with the file upload
- Response code: 200 or 201 (success)

---

## Troubleshooting

### Issue: "Extension not detected" warning

**Solution**:
1. Go to `chrome://extensions/`
2. Find "SurveyCTO Form Uploader"
3. Verify it's **turned ON** (toggle switch blue)
4. Click **Refresh** button
5. Reload Google Sheet (F5)
6. Try deploying again

### Issue: Extension loads but doesn't activate on Design page

**Solution**:
1. Make sure you're on https://pspsicm.surveycto.com/main.html#Design
2. Open DevTools (F12)
3. Go to **Console** tab
4. Look for `[Content Script] Loaded...` message
5. If not there:
   - Go to `chrome://extensions/`
   - Find extension
   - Click "Inspect views: service_worker"
   - Check for errors

### Issue: File uploads but nothing happens

**Solution**:
1. Check if upload happened:
   - Look in Design page for new/updated form
   - Check deployed version number changed
2. Check DevTools console for errors
3. Look for submit button on Design page
   - May have different text/ID
   - May need to update `content.js`

### Issue: Deployment logged but status shows "Pending" not "Completed"

**Solution**:
1. File likely uploaded successfully
2. Refresh Version History sheet (F5)
3. Check if status changed to "Completed"
4. If still "Pending":
   - Extension confirmation may have failed
   - Manually verify file uploaded in SurveyCTO

---

## If Something Goes Wrong

### Get Diagnostic Info

1. **Chrome DevTools** (F12 on Design page):
   - **Console tab** - look for `[Content Script]` messages
   - Copy full console output

2. **Extension DevTools**:
   - Go to `chrome://extensions/`
   - Click "Inspect views: service_worker"
   - Copy any error messages

3. **Apps Script Execution Log**:
   - Open Google Sheet
   - Go to Extensions → Apps Script
   - Go to **Executions** tab
   - Look for failed executions
   - Check error messages

### Manual Workaround

If extension doesn't auto-upload:

1. Let extension open Design page
2. On Design page, manually:
   - Click file input
   - Select XLSX file from Google Drive
   - Click Upload button
   - Wait for processing
3. Go back to Google Sheets
4. Check Version History - deployment should be logged

---

## Next Steps After Testing

✅ **Test with this guide** - verify everything works  
✅ **Check SurveyCTO** - confirm file uploaded  
✅ **Check Version History** - confirm logged as "Completed"  
✅ **Try another deployment** - test consistency  
✅ **Distribute to team** - share extension with team members  

---

## Quick Checklist

- [ ] Extension loads in Chrome without errors
- [ ] Extension icon visible in toolbar
- [ ] Navigate to Design page - icon activates
- [ ] DevTools shows `[Content Script] Loaded` message
- [ ] Google Sheets deploy dialog shows "Solution 2" message
- [ ] File generates successfully
- [ ] SurveyCTO opens in new tab
- [ ] File uploads automatically
- [ ] Status shows "✅ Deployment complete"
- [ ] Version History shows "Completed"

---

## Performance Expectations

| Step | Duration |
|------|----------|
| Generate XLSX | 2-3 seconds |
| Log deployment | 1 second |
| Send to extension | Instant |
| Open SurveyCTO | 2-3 seconds |
| Wait for page load | 2-5 seconds |
| File upload | 3-10 seconds |
| Form submission | 1-2 seconds |
| **Total** | **10-30 seconds** |

---

## Reporting Issues

If something doesn't work, provide:

1. **Your SurveyCTO server name** (pspsicm ✓)
2. **Full URL of Design page** where you see the form list
3. **DevTools console output** (full text from F12 → Console)
4. **Error messages** from DevTools or Apps Script
5. **What you expected to happen** vs **what actually happened**
6. **Chrome version** (Chrome menu → About Google Chrome)
7. **Screenshot** of DevTools console

This will help diagnose the issue quickly.

---

## Success Indicators

✅ **Console shows**: `[Content Script] Loaded on SurveyCTO Design page`  
✅ **Dialog shows**: "Solution 2: Auto-upload via Chrome extension"  
✅ **SurveyCTO opens** in new tab automatically  
✅ **File uploads** without manual drag-drop  
✅ **Dialog closes** after ~30 seconds  
✅ **Version History** shows "Completed" status  

If you see all of these → **Solution 2 is working!** 🎉

