import { GoogleGenAI, FunctionDeclaration, Type, Tool, Schema } from "@google/genai";
import { JobApplication, JobStatus } from "../types";
import { WES_JOB_AI_SYSTEM_INSTRUCTION, WES_JOB_AI_KNOWLEDGE_BASE } from "../constants";

// Helper to format jobs for the AI context
export const formatJobsForContext = (jobs: JobApplication[]) => {
  return JSON.stringify(jobs.map(j => ({
    id: j.id,
    company: j.company,
    role: j.role,
    status: j.status,
    dateApplied: j.dateApplied,
    lastUpdated: j.lastUpdated
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
  private chatModelId = "gemini-3-flash-preview"; 
  private parserModelId = "gemini-2.5-flash"; // Fast & cheap for parsing

  private getApiKey() {
    return localStorage.getItem('mycrm-google-api-key') || process.env.API_KEY || '';
  }

  private getClient() {
    const apiKey = this.getApiKey();
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
  }

  // 1. Chat Feature (Neural Link)
  async chat(
    message: string, 
    jobsContext: string, 
    history: {role: 'user' | 'model', content: string}[]
  ) {
    const client = this.getClient();
    if (!client) return { text: "Error: API Key missing. Please configure it in settings.", functionCalls: [] };

    try {
      const model = client.models;
      
      const systemInstruction = `
      ${WES_JOB_AI_SYSTEM_INSTRUCTION}
      ${WES_JOB_AI_KNOWLEDGE_BASE}
      
      *** IMMEDIATE OPERATIONAL CONTEXT (JobOps App) ***
      Current Date: ${new Date().toLocaleDateString()}
      Current Job Pipeline Context (JSON):
      ${jobsContext}

      *** INTERFACE RULES ***
      1. Use 'addJob' to create records.
      2. Use 'updateStatus' to change status.
      `;

      const result = await model.generateContent({
        model: this.chatModelId,
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

      return {
        text: result.text || (result.functionCalls && result.functionCalls.length > 0 ? "Executing..." : "I didn't understand that."),
        functionCalls: result.functionCalls || []
      };

    } catch (error) {
      console.error("Gemini API Error:", error);
      return { text: "Neural Link Offline. Check API Key.", functionCalls: [] };
    }
  }

  // 2. Smart Fill Feature (Parse JD)
  async parseJobDescription(text: string) {
    const client = this.getClient();
    if (!client) throw new Error("API Key missing");

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        company: { type: Type.STRING },
        role: { type: Type.STRING },
        location: { type: Type.STRING },
        salary: { type: Type.STRING },
        summary: { type: Type.STRING, description: "A brief 2-sentence summary of the role focus." },
        skills: { type: Type.STRING, description: "Comma separated top 5 skills." }
      },
      required: ["company", "role"]
    };

    const result = await client.models.generateContent({
      model: this.parserModelId,
      contents: `Extract job details from this text. If specific fields aren't found, leave them empty or infer reasonable defaults based on context. Text: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    return JSON.parse(result.text || "{}");
  }

  // 3. Daily Briefing Feature
  async getDailyBriefing(jobsContext: string) {
    const client = this.getClient();
    if (!client) return "Configure API Key to get daily insights.";

    const result = await client.models.generateContent({
      model: this.chatModelId,
      contents: `Analyze this job pipeline and give me a 2-sentence 'Daily Strategic Focus'. 
      Prioritize following up on stale items (Applied > 7 days ago) or preparing for active interviews.
      Be direct and motivational.
      
      Context: ${jobsContext}`,
      config: {
        temperature: 0.7,
        maxOutputTokens: 100,
      }
    });

    return result.text || "Keep pushing forward.";
  }

  // 4. Job Architect: Cover Letter
  async generateCoverLetter(company: string, role: string, jobDescription: string) {
    const client = this.getClient();
    if (!client) throw new Error("API Key missing");
    
    const prompt = `
    Using the profile of John Wesley Quintero (provided in system instructions), write a highly tailored, professional markdown cover letter for the role of ${role} at ${company}.
    
    JOB DESCRIPTION:
    ${jobDescription}
    
    TONE: Professional, confident, operational, "System-Builder" mindset.
    FORMAT: Markdown.
    `;

    const result = await client.models.generateContent({
      model: this.chatModelId,
      contents: prompt,
      config: {
        systemInstruction: WES_JOB_AI_KNOWLEDGE_BASE, // Inject persona
        temperature: 0.7
      }
    });

    return result.text || "Could not generate cover letter.";
  }

  // 5. Job Architect: Fit Gap
  async generateFitGapAnalysis(jobDescription: string) {
    const client = this.getClient();
    if (!client) throw new Error("API Key missing");

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        matches: { type: Type.ARRAY, items: { type: Type.STRING } },
        missing: { type: Type.ARRAY, items: { type: Type.STRING } },
        talkingPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
        score: { type: Type.NUMBER, description: "Match score 0-100" }
      },
      required: ["matches", "missing", "talkingPoints", "score"]
    };

    const result = await client.models.generateContent({
      model: this.chatModelId,
      contents: `Analyze this Job Description against my profile. Identify strong matches, missing keywords/skills I should address, and suggest talking points to bridge the gap.
      
      JOB DESCRIPTION:
      ${jobDescription}`,
      config: {
        systemInstruction: WES_JOB_AI_KNOWLEDGE_BASE,
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    return JSON.parse(result.text || "{}");
  }
}

export const geminiService = new GeminiService();