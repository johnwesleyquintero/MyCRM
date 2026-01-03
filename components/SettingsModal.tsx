import React, { useState, useEffect } from 'react';
import { X, Save, Database, Server, CheckCircle, Copy, ExternalLink, ClipboardCheck, Sparkles, Key, ListPlus, Trash2, Plus } from 'lucide-react';
import { CustomFieldDefinition } from '../types';

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
`;

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'backend' | 'customFields'>('backend');
  const [scriptUrl, setScriptUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [newField, setNewField] = useState({ label: '', type: 'text' as const });

  useEffect(() => {
    const savedUrl = localStorage.getItem('mycrm-backend-url');
    if (savedUrl) setScriptUrl(savedUrl);
    
    const savedKey = localStorage.getItem('mycrm-google-api-key');
    if (savedKey) setApiKey(savedKey);

    const savedFields = localStorage.getItem('mycrm-custom-fields');
    if (savedFields) {
      try {
        setCustomFields(JSON.parse(savedFields));
      } catch (e) {
        setCustomFields([]);
      }
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('mycrm-backend-url', scriptUrl);
    localStorage.setItem('mycrm-google-api-key', apiKey);
    localStorage.setItem('mycrm-custom-fields', JSON.stringify(customFields));
    // Reload page to re-initialize context with new URL and Service
    window.location.reload();
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

  const handleAddField = () => {
    if (!newField.label.trim()) return;
    
    const id = newField.label.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const newDefinition: CustomFieldDefinition = {
      id,
      label: newField.label,
      type: newField.type
    };

    // Avoid duplicates
    if (customFields.some(f => f.id === id)) {
      alert("A field with a similar name already exists.");
      return;
    }

    setCustomFields([...customFields, newDefinition]);
    setNewField({ label: '', type: 'text' });
  };

  const handleDeleteField = (id: string) => {
    setCustomFields(customFields.filter(f => f.id !== id));
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
              <p className="text-xs text-slate-500">Manage connectivity, storage, and fields</p>
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
              <Sparkles size={16} />
              <span>AI & General</span>
            </button>
             <button
              onClick={() => setActiveTab('customFields')}
              className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'customFields' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ListPlus size={16} />
              <span>Custom Fields</span>
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
                           *Data will sync to this sheet. Local Storage will act as a backup.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'general' && (
              <div className="space-y-8">
                {/* AI Configuration */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                    <Sparkles className="text-indigo-600" size={18} />
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Neural Link Configuration</h3>
                  </div>
                  
                  <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                    <p className="text-indigo-700 text-xs leading-relaxed">
                      To activate WesAI, you need a Google Gemini API Key. This key is stored locally in your browser and never sent to our servers.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Google Gemini API Key</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Key size={14} className="text-slate-400" />
                      </div>
                      <input 
                        type="password" 
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="AIzaSy..."
                        className="pl-9 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Don't have a key? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">Get one from Google AI Studio</a>.
                    </p>
                  </div>
                </div>

                {/* General Configuration */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                    <Database className="text-slate-600" size={18} />
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Data Storage</h3>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <Database size={24} className="text-slate-400"/>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Local Storage Active</p>
                      <p className="text-xs text-slate-500">Your data persists in this browser's cache.</p>
                    </div>
                    <div className="flex-1 text-right">
                       <span className="text-xs text-emerald-600 font-medium px-2 py-1 bg-emerald-50 rounded border border-emerald-100">Enabled</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'customFields' && (
              <div className="space-y-6">
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                  <h3 className="text-indigo-900 font-semibold text-sm mb-1">Custom Fields</h3>
                  <p className="text-indigo-700 text-xs leading-relaxed">
                    Define additional fields to track specific data points (e.g., Referral Source, Recruiter Name). 
                    These fields will appear in the "New Application" modal.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Add New Field</h3>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Field Label (e.g. Referral)" 
                      className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={newField.label}
                      onChange={(e) => setNewField({...newField, label: e.target.value})}
                    />
                    <select 
                      className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                      value={newField.type}
                      onChange={(e) => setNewField({...newField, type: e.target.value as any})}
                    >
                      <option value="text">Text</option>
                      <option value="date">Date</option>
                      <option value="url">URL</option>
                      <option value="number">Number</option>
                    </select>
                    <button 
                      onClick={handleAddField}
                      disabled={!newField.label.trim()}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-2"
                    >
                      <Plus size={16} />
                      <span className="hidden sm:inline">Add</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                   <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Active Fields</h3>
                   {customFields.length === 0 && (
                     <p className="text-sm text-slate-400 italic">No custom fields defined yet.</p>
                   )}
                   <div className="space-y-2">
                     {customFields.map((field) => (
                       <div key={field.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-medium text-slate-800">{field.label}</span>
                            <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded uppercase tracking-wider">{field.type}</span>
                          </div>
                          <button 
                            onClick={() => handleDeleteField(field.id)}
                            className="text-slate-400 hover:text-rose-500 p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                       </div>
                     ))}
                   </div>
                </div>
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
            <span>Save & Reload</span>
          </button>
        </div>
      </div>
    </div>
  );
};