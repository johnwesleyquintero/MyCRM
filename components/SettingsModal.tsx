import React, { useState, useEffect } from 'react';
import { X, Save, Database, Server, CheckCircle, Copy, ExternalLink, ClipboardCheck } from 'lucide-react';

const BACKEND_CODE = `/**
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
  'contacts'
];

/**
 * INITIAL SETUP
 * Run this function once to create the sheet and headers.
 */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Delete default Sheet1 if it exists and is empty
    const defaultSheet = ss.getSheetByName('Sheet1');
    if (defaultSheet && defaultSheet.getLastRow() === 0) {
      ss.deleteSheet(defaultSheet);
    }
  }
  
  const currentHeaders = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  if (currentHeaders[0] === '') {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    Logger.log('Sheet setup complete.');
  } else {
    Logger.log('Sheet already set up.');
  }
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
        // Handle dates or empty strings if necessary
        job[header] = row[index];
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
    // Assuming ID is always in column 1 (index 0)
    const idColumnIndex = 0; 
    
    // Find row index (0-based in array, need +1 for Sheet if writing)
    const rowIndex = data.findIndex(row => row[idColumnIndex] === payload.id);

    // --- CREATE ---
    if (action === 'create') {
      if (rowIndex !== -1) return createErrorResponse("ID already exists");

      // Map object to array based on HEADERS order
      const newRow = HEADERS.map(header => {
        return payload[header] === undefined || payload[header] === null ? '' : payload[header];
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
        return payload.hasOwnProperty(header) ? payload[header] : currentRow[colIndex];
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
`;

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'backend'>('backend');
  const [scriptUrl, setScriptUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const savedUrl = localStorage.getItem('mycrm-backend-url');
    if (savedUrl) setScriptUrl(savedUrl);
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('mycrm-backend-url', scriptUrl);
    // In a full implementation, this would trigger a context reload
    onClose();
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(BACKEND_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-slate-200 rounded-lg text-slate-600">
               <Database size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">System Configuration</h2>
              <p className="text-xs text-slate-500">Manage connectivity and storage</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content Layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-48 bg-slate-50 border-r border-slate-200 p-4 space-y-2 flex-shrink-0">
            <button
              onClick={() => setActiveTab('backend')}
              className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'backend' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Server size={16} />
              <span>Backend Setup</span>
            </button>
             <button
              onClick={() => setActiveTab('general')}
              className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'general' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Database size={16} />
              <span>General</span>
            </button>
          </div>

          {/* Main Panel */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            {activeTab === 'backend' && (
              <div className="space-y-6">
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                  <h3 className="text-indigo-900 font-semibold text-sm mb-1">Sovereign Architecture</h3>
                  <p className="text-indigo-700 text-xs leading-relaxed">
                    MyCRM runs serverless. To enable cloud sync across devices, you must deploy the Google Apps Script backend. 
                    Without this, data is stored locally in your browser.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Deployment Instructions</h3>
                  
                  <div className="space-y-4 text-sm text-slate-600">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">1</div>
                      <div className="space-y-2">
                        <p className="font-medium text-slate-900">Create the Sheet</p>
                        <p>Go to <a href="https://sheets.new" target="_blank" className="text-blue-600 hover:underline inline-flex items-center">sheets.new <ExternalLink size={10} className="ml-1"/></a> and create a new Google Sheet named "MyCRM Database".</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">2</div>
                      <div className="space-y-2 w-full">
                        <div className="flex justify-between items-center">
                            <p className="font-medium text-slate-900">Install Backend Script</p>
                            <button 
                                onClick={handleCopyCode}
                                className="flex items-center space-x-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium bg-indigo-50 px-2 py-1 rounded transition-colors"
                            >
                                {copied ? <ClipboardCheck size={14} /> : <Copy size={14} />}
                                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                            </button>
                        </div>
                        <p>Open <strong>Extensions &gt; Apps Script</strong>. Delete any existing code and paste the following:</p>
                        <div className="relative group">
                            <pre className="bg-slate-900 text-slate-300 p-3 rounded-lg text-xs overflow-x-auto h-64 font-mono custom-scrollbar border border-slate-700">
                                <code>{BACKEND_CODE}</code>
                            </pre>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">3</div>
                      <div className="space-y-2">
                        <p className="font-medium text-slate-900">Initialize & Deploy</p>
                        <ul className="list-disc pl-4 space-y-1 text-xs text-slate-500">
                          <li>Run the <code>setup()</code> function once to create headers.</li>
                          <li>Click <strong>Deploy &gt; New Deployment</strong>.</li>
                          <li>Select type: <strong>Web App</strong>.</li>
                          <li>Execute as: <strong>Me</strong>.</li>
                          <li>Who has access: <strong>Anyone</strong> (Required for API access).</li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">4</div>
                      <div className="space-y-2 flex-1">
                        <p className="font-medium text-slate-900">Connect Application</p>
                        <p className="mb-2">Paste the "Web App URL" provided by Google below:</p>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={scriptUrl}
                            onChange={(e) => setScriptUrl(e.target.value)}
                            placeholder="https://script.google.com/macros/s/..."
                            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                           *Currently this setting saves to LocalStorage for future V2 integration.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'general' && (
              <div className="flex items-center justify-center h-full text-slate-400 flex-col space-y-2">
                <Database size={32} className="opacity-50"/>
                <p>Local Storage is currently active.</p>
                <p className="text-xs">Data persists in your browser cache.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2">
            <Save size={16} />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>
    </div>
  );
};
