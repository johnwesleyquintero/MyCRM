# MyCRM / JobOps

**Sovereign Job Application & Lead Tracking System**

Inspired by **MyOps v2.2**, this application provides a robust, offline-capable, and AI-enhanced platform for managing job applications. It adheres to a "Sovereign" architecture: you own the code, you own the data (Google Sheets), and there are no recurring SaaS subscription fees.

## 🚀 Core Capabilities

### 1. Mission Control
A comprehensive dashboard featuring high-level KPIs, pipeline distribution charts, and velocity tracking to keep your job search data-driven.

### 2. Pipeline Management (Kanban)
Drag-and-drop interface to manage applications through their lifecycle:
*   **Applied**
*   **Interviewing**
*   **Offers**
*   **Rejected**

### 3. Neural Link (WesAI Copilot)
Integrated AI assistant powered by **Google Gemini**.
*   **Context Aware**: Knows your specific job list and status.
*   **Action Oriented**: Can add applications and update statuses via natural language command (e.g., *"Add Netflix, Senior Engineer, Applied today"*).
*   **Persona**: Adopted "WesAI" persona—a helpful, systems-focused operational assistant.

### 4. Sovereign Backend
Uses **Google Sheets** + **Google Apps Script** as a serverless database.
*   **Zero Cost**: Runs entirely on free Google infrastructure.
*   **Data Ownership**: Your data lives in your Google Drive, not a third-party server.
*   **Portable**: Export your data to Excel/CSV at any time.

---

## 🛠 Tech Stack

*   **Frontend**: React 19, Tailwind CSS
*   **Visualization**: Recharts
*   **Icons**: Lucide React
*   **AI**: Google GenAI SDK (`@google/genai`)
*   **Backend**: Google Apps Script (GAS)

---

## 📦 Setup & Deployment

### 1. API Key Configuration
This application requires a **Google Gemini API Key** to power the Neural Link.
1. Obtain a key from [Google AI Studio](https://aistudio.google.com/).
2. The application expects the key to be available via `process.env.API_KEY`.

### 2. Backend Installation (Google Sheets)
To persist data to the cloud instead of LocalStorage:

1.  Create a new **Google Sheet**.
2.  Go to **Extensions** > **Apps Script**.
3.  Copy the code from `backend/Code.gs` in this repository.
4.  Paste it into the Apps Script editor.
5.  Run the `setup()` function to initialize columns.
6.  **Deploy** as a Web App:
    *   **Execute as**: Me
    *   **Who has access**: Anyone (Allows the React app to communicate with it).
7.  (Future Integration) Update `store/JobContext.tsx` to fetch/post to your Web App URL.

### 3. Local Development
This project uses modern ESM imports.

```bash
# If using a standard build tool (Vite/Next/CRA)
npm install
npm run dev
```

---

## 🤖 Using WesAI (Neural Link)

Click the **Neural Link** button in the header to open the AI sidebar.

**Example Commands:**
*   *"Add a new application for Spotify, Product Manager, Applied yesterday."*
*   *"I got rejected by Horizon E-Com, please update the status."*
*   *"Summarize my current active interviews."*
*   *"Draft a follow-up email for the Quantum Systems offer."*

---

## 📂 Project Structure

*   `components/` - React UI components (Dashboard, Kanban, Table, etc.).
*   `services/` - Gemini AI integration and tool definitions.
*   `store/` - State management (currently LocalStorage + Context API).
*   `backend/` - Google Apps Script code for the serverless database.
*   `types.ts` - TypeScript interfaces.
*   `constants.ts` - Mock data and AI System Instructions.

---

**License**: MIT
**Author**: John Wesley Quintero
