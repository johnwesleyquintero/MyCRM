/**
 * MyCRM / JobOps Backend Script
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Create a new Google Sheet.
 * 2. Go to Extensions > Apps Script.
 * 3. Paste this code into Code.gs.
 * 4. Run the 'setup' function once to initialize the sheet headers.
 * 5. Deploy as Web App:
 *    - Description: JobOps API
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Copy the Web App URL and use it in your frontend configuration.
 */

// CONFIGURATION
const SHEET_NAME = 'Applications';
const HEADERS = [
  'id', 
  'company', 
  'role', 
  'status', 
  'dateApplied', 
  'lastUpdated', 
  'link', 
  'notes', 
  'nextAction', 
  'nextActionDate', 
  'salary', 
  'location', 
  'contacts',
  'customFields' // Stores JSON string of custom fields
];

/**
 * INITIAL SETUP
 * Run this function once to create the sheet and headers.
 * Safe to run multiple times - it checks for missing headers.
 */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    const defaultSheet = ss.getSheetByName('Sheet1');
    if (defaultSheet && defaultSheet.getLastRow() === 0) {
      ss.deleteSheet(defaultSheet);
    }
  }
  
  // Check existing headers
  const lastCol = sheet.getLastColumn();
  let currentHeaders = [];
  if (lastCol > 0) {
    currentHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  }

  // Append missing headers
  const newHeaders = [];
  HEADERS.forEach((header, index) => {
    if (index >= currentHeaders.length || currentHeaders[index] !== header) {
      // If header is missing or different at this position (simple check)
      // Note: This assumes strict order. If sheet has mixed order, this might duplicate.
      // For Sovereign simplicity, we assume strict structure.
      if (!currentHeaders.includes(header)) {
        sheet.getRange(1, currentHeaders.length + 1 + newHeaders.length).setValue(header);
        newHeaders.push(header);
      }
    }
  });

  if (newHeaders.length > 0) {
    Logger.log('Added new headers: ' + newHeaders.join(', '));
  } else {
    Logger.log('Setup complete. No new headers needed.');
  }
  
  sheet.setFrozenRows(1);
}

/**
 * HANDLE GET REQUESTS (Read Data)
 */
function doGet(e) {
  const lock = LockService.getScriptLock();
  // Wait for up to 10 seconds for other processes to finish.
  lock.tryLock(10000);
  
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) return createErrorResponse("Sheet not found. Run setup() first.");

    const rows = sheet.getDataRange().getValues();
    const headers = rows.shift(); // Remove headers
    
    // Map array data to objects
    const jobs = rows.map(row => {
      let job = {};
      headers.forEach((header, index) => {
        const value = row[index];
        
        // Special handling for customFields (JSON)
        if (header === 'customFields') {
          try {
             job[header] = value ? JSON.parse(value) : {};
          } catch (e) {
             job[header] = {};
          }
        } else {
          // Handle dates or empty strings if necessary
          job[header] = value;
        }
      });
      return job;
    });

    return createSuccessResponse(jobs);
    
  } catch (err) {
    return createErrorResponse(err.toString());
  } finally {
    lock.releaseLock();
  }
}

/**
 * HANDLE POST REQUESTS (Create, Update, Delete)
 * Expected Payload: { action: 'create'|'update'|'delete', data: JobObject }
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) return createErrorResponse("Sheet not found.");

    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action; 
    const payload = requestData.data;

    if (!payload || !payload.id) {
       return createErrorResponse("Missing payload or ID");
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0]; // Get actual headers from sheet
    // Assuming ID is always in column 1 (index 0) based on setup
    const idColumnIndex = headers.indexOf('id');
    if (idColumnIndex === -1) return createErrorResponse("Invalid Sheet Structure: ID column missing");
    
    // Find row index (0-based in array, need +1 for Sheet if writing)
    const rowIndex = data.findIndex(row => row[idColumnIndex] === payload.id);

    // --- CREATE ---
    if (action === 'create') {
      if (rowIndex !== -1) return createErrorResponse("ID already exists");

      // Map object to array based on HEADERS order defined in script
      const newRow = HEADERS.map(header => {
        let value = payload[header];
        
        if (header === 'customFields') {
          value = JSON.stringify(payload[header] || {});
        }
        
        return value === undefined || value === null ? '' : value;
      });
      
      sheet.appendRow(newRow);
      return createSuccessResponse({ message: "Job created", id: payload.id });
    }

    // --- UPDATE ---
    if (action === 'update') {
      if (rowIndex === -1) return createErrorResponse("Job ID not found");

      const sheetRowIndex = rowIndex + 1; 
      const currentRow = data[rowIndex];
      
      // Merge existing data with updates
      const updatedRow = HEADERS.map((header, colIndex) => {
        let value = payload.hasOwnProperty(header) ? payload[header] : currentRow[colIndex];
        
        // If we are updating customFields, ensure it's stringified
        if (header === 'customFields' && typeof value === 'object') {
           value = JSON.stringify(value);
        }
        
        return value;
      });

      sheet.getRange(sheetRowIndex, 1, 1, HEADERS.length).setValues([updatedRow]);
      return createSuccessResponse({ message: "Job updated" });
    }

    // --- DELETE ---
    if (action === 'delete') {
      if (rowIndex === -1) return createErrorResponse("Job ID not found");
      
      // Delete the row (rowIndex + 1)
      sheet.deleteRow(rowIndex + 1);
      return createSuccessResponse({ message: "Job deleted" });
    }

    return createErrorResponse("Invalid action");

  } catch (err) {
    return createErrorResponse(err.toString());
  } finally {
    lock.releaseLock();
  }
}

/**
 * HELPER: Format JSON Success Response
 */
function createSuccessResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

/**
 * HELPER: Format JSON Error Response
 */
function createErrorResponse(message) {
  const output = ContentService.createTextOutput(JSON.stringify({ status: 'error', message: message }));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}