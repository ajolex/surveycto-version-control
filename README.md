# SurveyCTO Version Control - Google Apps Script Add-on

A Google Sheets add-on for managing SurveyCTO form deployments with Git-like version control. Track every deployment, add meaningful commit messages, and maintain a complete history of your form changes.

## ✨ Features

- **One-Click Deploy** - Deploy forms to SurveyCTO with a single click plus a commit message
- **Auto-Versioning** - Automatic semantic versioning (v1.0 → v1.1 → v1.2, etc.)
- **Version History** - Persistent deployment history in a dedicated sheet
- **SurveyCTO API Integration** - Real deployments via the SurveyCTO API
- **Secure Credentials** - Credentials stored securely using Google's Properties Service
- **CSV Export** - Export version history for data cleaning reference
- **User-Friendly UI** - Custom sidebar and dialogs for easy navigation

## 📋 Prerequisites

- A Google account with access to Google Sheets
- A SurveyCTO server account with API access
- SurveyCTO API credentials (username/email and password)

## 🚀 Installation

### Method 1: Copy to Your Google Sheet

1. Open a new or existing Google Sheet
2. Go to **Extensions** → **Apps Script**
3. Delete any existing code in the editor
4. Copy the contents of each file into the Apps Script project:
   - `Code.gs` → Main script file
   - `Sidebar.html` → HTML file (File → New → HTML file → name it "Sidebar")
   - `Dialog.html` → HTML file (File → New → HTML file → name it "Dialog")
   - `Settings.html` → HTML file (File → New → HTML file → name it "Settings")
5. Copy the contents of `appsscript.json`:
   - In Apps Script, go to **Project Settings** (gear icon)
   - Check "Show 'appsscript.json' manifest file in editor"
   - Click on `appsscript.json` in the editor and paste the content
6. Save all files (Ctrl/Cmd + S)
7. Refresh your Google Sheet
8. You should see the **SurveyCTO Version Control** menu

### Method 2: Deploy as Add-on (Advanced)

For organization-wide deployment, you can publish as a Google Workspace add-on. See [Google's documentation](https://developers.google.com/workspace/add-ons/how-tos/publish-add-on) for details.

## ⚙️ Configuration

### Setting Up SurveyCTO Credentials

1. Click **SurveyCTO Version Control** → **Settings** in the menu
2. Enter your SurveyCTO details:
   - **Server URL**: Your SurveyCTO server name (e.g., `myorg` for myorg.surveycto.com)
   - **Username**: Your SurveyCTO email address
   - **Password**: Your SurveyCTO password or API key
3. Click **Test Connection** to verify
4. Click **Save** to store your credentials

> **🔒 Security Note**: Credentials are stored securely using Google's [Properties Service](https://developers.google.com/apps-script/reference/properties) and are only accessible to you.

## 📖 Usage Guide

### Deploying a Form

1. Click **SurveyCTO Version Control** → **Deploy Form** (or use the sidebar)
2. Select a form from the dropdown or enter a Form ID manually
3. Enter a deployment message describing your changes (like a Git commit message)
4. Click **Deploy**
5. The deployment will be logged with:
   - Auto-incremented version number
   - Timestamp
   - Your email
   - Deployment message
   - Status

### Viewing Version History

- Click **SurveyCTO Version Control** → **View Version History**
- Or use the sidebar to see recent deployments
- The history is stored in a sheet called "Version History"

### Exporting to CSV

1. Click **SurveyCTO Version Control** → **Export to CSV**
2. The CSV file will be created in your Google Drive
3. Use this for data cleaning reference or external tracking

### Using the Sidebar

1. Click **SurveyCTO Version Control** → **Open Sidebar**
2. The sidebar provides quick access to:
   - Deploy button
   - Settings
   - Recent deployment history
   - Export functionality

## 📊 Version History Sheet

The add-on automatically creates and maintains a "Version History" sheet with the following columns:

| Column | Description |
|--------|-------------|
| Version | Auto-incremented version (v1.0, v1.1, etc.) |
| Form ID | The SurveyCTO form identifier |
| Form Name | Human-readable form name |
| Deployed By | User who deployed |
| Timestamp | ISO 8601 timestamp |
| Message | Deployment commit message |
| Status | Success/Failed/Logged |

## 🔧 Troubleshooting

### "Authorization required" error
- Click through the authorization prompts
- Make sure to allow all required permissions

### "Connection failed" in Settings
- Verify your server URL (just the server name, not the full URL)
- Check your username and password
- Ensure your SurveyCTO account has API access

### Forms not loading in dropdown
- Verify your credentials are correct
- Check if you have permission to access forms on your server
- Use manual Form ID entry as a fallback

### Menu not appearing
- Refresh the Google Sheet
- Make sure the script is saved
- Check for errors in the Apps Script editor (View → Logs)

## 🛡️ OAuth Scopes

This add-on requires the following permissions:

| Scope | Purpose |
|-------|---------|
| `spreadsheets.currentonly` | Read/write to the current spreadsheet |
| `script.container.ui` | Display sidebar and dialogs |
| `userinfo.email` | Get current user's email for logging |
| `script.external_request` | Call SurveyCTO API |
| `drive.file` | Create CSV export files |

## 📝 Best Practices

1. **Write meaningful commit messages** - Describe what changed, not just "updated form"
2. **Deploy after testing** - Test your form changes before deploying to production
3. **Regular exports** - Export version history periodically for backup
4. **Team coordination** - Share the Google Sheet with your team for collaborative tracking

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built for the SurveyCTO community
- Inspired by Git version control workflows
- Uses Google Apps Script and SurveyCTO API
