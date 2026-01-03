# MyCRM Backend Setup (Google Apps Script)

Since this app is "Sovereign" and serverless, the backend is a Google Sheet controlled by Google Apps Script.

## 1. Create the Sheet
1. Go to [sheets.new](https://sheets.new) to create a new Google Sheet.
2. Name it "MyCRM Database".

## 2. Install the Script
1. In the Sheet, go to **Extensions** > **Apps Script**.
2. Rename the project to "MyCRM Backend".
3. Copy the content of `backend/Code.gs` from this project.
4. Paste it into the `Code.gs` file in the script editor (replace any existing code).
5. Click the **Save** icon (Floppy disk).

## 3. Initialize
1. In the toolbar, ensure the function `setup` is selected in the dropdown.
2. Click **Run**.
3. Grant the necessary permissions (Click Review Permissions > Choose Account > Advanced > Go to MyCRM Backend (Unsafe) > Allow).
4. Verify that a sheet named "Applications" was created with the correct headers.

## 4. Deploy as API
1. Click the blue **Deploy** button > **New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. **Description**: "v1".
4. **Execute as**: "Me" (your email).
5. **Who has access**: **Anyone** (This is required for the React app to access it via AJAX without complex OAuth flows).
6. Click **Deploy**.
7. Copy the **Web App URL** (starts with `https://script.google.com/macros/s/...`).

## 5. Connect Frontend
(Future Step) You will paste this URL into your React App's configuration to replace the local storage logic.
