import { GoogleGenAI, FunctionDeclaration, Type, Tool } from "@google/genai";
import { JobApplication, JobStatus } from "../types";
import { WES_JOB_AI_SYSTEM_INSTRUCTION, WES_JOB_AI_KNOWLEDGE_BASE } from "../constants";

// Helper to format jobs for the AI context
export const formatJobsForContext = (jobs: JobApplication[]) => {
  return JSON.stringify(jobs.map(j => ({
    id: j.id,
    company: j.company,
    role: j.role,
    status: j.status,
    notes: j.notes,
    nextAction: j.nextAction
  })));
};

// Tool Definitions
const addJobTool: FunctionDeclaration = {
  name: "addJob",
  description: "Add a new job application to the tracking system.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      company: { type: Type.STRING, description: "Company name" },
      role: { type: Type.STRING, description: "Job role/title" },
      status: { type: Type.STRING, description: "Current status (Applied, Interview, Offer, Rejected)" },
      link: { type: Type.STRING, description: "Link to job description" },
      notes: { type: Type.STRING, description: "Initial notes or details" },
    },
    required: ["company", "role"]
  }
};

const updateStatusTool: FunctionDeclaration = {
  name: "updateStatus",
  description: "Update the status of an existing job application.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      companyName: { type: Type.STRING, description: "Name of the company to update (fuzzy match)" },
      newStatus: { type: Type.STRING, description: "New status (Applied, Interview, Offer, Rejected)" },
      notes: { type: Type.STRING, description: "Optional note to append about the update" }
    },
    required: ["companyName", "newStatus"]
  }
};

const tools: Tool[] = [{ functionDeclarations: [addJobTool, updateStatusTool] }];

export class GeminiService {
  private ai: GoogleGenAI;
  private modelId = "gemini-3-flash-preview"; // Optimized for speed/latency in chat

  constructor() {
    // This assumes process.env.API_KEY is available. 
    // In a real app, you might check if it exists before instantiating.
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async chat(
    message: string, 
    jobsContext: string, 
    history: {role: 'user' | 'model', content: string}[]
  ) {
    if (!process.env.API_KEY) {
      return { text: "Error: API Key is missing. Please check your configuration.", functionCalls: [] };
    }

    try {
      const model = this.ai.models;
      
      const systemInstruction = `
      ${WES_JOB_AI_SYSTEM_INSTRUCTION}

      ${WES_JOB_AI_KNOWLEDGE_BASE}
      
      *** IMMEDIATE OPERATIONAL CONTEXT (JobOps App) ***
      You are currently integrated into the JobOps Dashboard.
      Current Date: ${new Date().toLocaleDateString()}
      
      Current Job Pipeline Context (JSON):
      ${jobsContext}

      *** INTERFACE RULES (CRITICAL) ***
      1. When the user asks to add a job to the tracker, you MUST use the 'addJob' tool.
      2. When the user reports a status change (e.g., "Google rejected me"), you MUST use the 'updateStatus' tool.
      3. If asked to summarize the pipeline, use the provided JSON context.
      `;

      // Transform history for the API if needed, or just send the last message with context 
      // For simplicity in this demo, we are doing a single turn with context injection, 
      // but keeping history in mind for future expansion.
      
      const result = await model.generateContent({
        model: this.modelId,
        config: {
          systemInstruction: systemInstruction,
          tools: tools,
          temperature: 0.7,
        },
        contents: [
            ...history.map(h => ({ role: h.role, parts: [{ text: h.content }] })),
            { role: 'user', parts: [{ text: message }] }
        ]
      });

      const response = result.candidates?.[0]?.content;
      const textPart = response?.parts?.find(p => p.text)?.text;
      const functionCalls = response?.parts?.filter(p => p.functionCall).map(p => p.functionCall) || [];

      return {
        text: textPart || (functionCalls.length > 0 ? "Processing your request..." : "I didn't understand that."),
        functionCalls: functionCalls
      };

    } catch (error) {
      console.error("Gemini API Error:", error);
      return { text: "Sorry, I encountered an error connecting to the Neural Link.", functionCalls: [] };
    }
  }
}

export const geminiService = new GeminiService();
