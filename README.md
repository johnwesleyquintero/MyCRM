# MyCRM / JobOps

**Sovereign Job Application & Lead Tracking System**

**MyCRM / JobOps** is a "Sovereign" personal CRM designed for high-velocity job hunting. It combines the speed of a local spreadsheet with the power of modern AI, ensuring you own your data while leveraging advanced automation to manage your career pipeline.

## 🚀 Core Capabilities

### 1. Mission Control & Analytics
*   **Dashboard**: High-level KPIs, pipeline distribution charts, and velocity tracking.
*   **Mission Intelligence**: AI-generated strategic focus cards providing a "Commander's Intent" for your day—featuring punchy headlines, actionable advice, and one-click refresh.

### 2. Pipeline Management
*   **Kanban Board**: Drag-and-drop interface for managing application stages (Applied, Interview, Offer, Rejected).
*   **Timeline View**: Visual agenda for upcoming interviews and follow-ups, plus a history log of recent activity.
*   **Data Table**: Sortable, searchable list view with inline status editing.

### 3. Neural Link (WesAI Copilot)
An integrated AI assistant powered by **Google Gemini**:
*   **Context Aware**: Chat with an AI that knows your specific job pipeline.
*   **Action Oriented**: Add applications or update statuses via natural language (e.g., *"Add Netflix, Senior Engineer, Applied today"*).
*   **Long-Term Memory**: Chat history is persisted locally.

### 4. Job Architect & Smart Fill
*   **Smart Fill**: Paste a Job Description (JD) to automatically extract company, role, salary, and skills into the application form.
*   **Cover Letter Generator**: Generates highly tailored, markdown-formatted cover letters based on the JD and your persona.
*   **Fit Gap Analysis**: AI analyzes the JD against your profile to find matches, gaps, and suggested interview talking points.

### 5. Sovereign Architecture
*   **Offline-First**: Works entirely in the browser using LocalStorage by default.
*   **Cloud Sync (Optional)**: Connect to a **Google Sheet** via Apps Script for multi-device sync and backup.
*   **Data Ownership**: Export/Import your data as JSON at any time via Settings.
*   **Customization**: Define custom fields (Text, Date, URL, Number) to track what matters to you.

---

## 🛠 Tech Stack

*   **Frontend**: React 19, Tailwind CSS
*   **Visualization**: Recharts
*   **Icons**: Lucide React
*   **AI**: Google GenAI SDK (`@google/genai`)
*   **Backend (Optional)**: Google Sheets + Google Apps Script (GAS)

---

## 📦 Setup & Configuration

### 1. Google Gemini API Key (Required for AI)
To enable Neural Link, Smart Fill, and Job Architect:
1.  Get a free API key from [Google AI Studio](https://aistudio.google.com/).
2.  Click **Settings** (bottom left of sidebar) > **General & AI**.
3.  Paste your API Key. It is stored locally in your browser and never sent to a backend server.

### 2. Cloud Backend Setup (Optional)
To sync data across devices using Google Sheets:
1.  Open **Settings** > **Backend Setup**.
2.  Follow the in-app instructions:
    *   Create a new Google Sheet.
    *   Copy the provided **Google Apps Script** code (available directly in the Settings modal).
    *   Paste it into **Extensions > Apps Script** in your sheet.
    *   Deploy as a **Web App** (Access: Anyone).
    *   Paste the resulting **Web App URL** back into JobOps settings.

### 3. Local Development
```bash
npm install
npm run dev
```

---

## 📂 Project Structure

*   `components/` - React UI components (Dashboard, Kanban, NeuralLink, JobDetailModal, etc.).
*   `services/` - Gemini AI integration (`geminiService.ts`) and tool definitions.
*   `store/` - State management (`JobContext`, `ToastContext`).
*   `backend/` - Google Apps Script code (`Code.gs`) for the serverless database.
*   `types.ts` - TypeScript interfaces.

---

**License**: MIT
**Author**: John Wesley Quintero