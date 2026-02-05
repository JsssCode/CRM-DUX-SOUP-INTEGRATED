
import { GoogleGenAI, Type } from "@google/genai";
import { Lead } from "../types";

export const generateFollowUpEmail = async (lead: Lead) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a professional sales assistant. Write a personalized follow-up LinkedIn message to ${lead.name} from ${lead.company}. They are in the "${lead.stage}" stage. Context: ${lead.notes}. Keep it under 100 words, professional but conversational.`,
    });
    return response.text || "I couldn't generate a response at this time.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating content.";
  }
};

export const analyzeLeadQuality = async (lead: Lead) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Evaluate this sales lead: Name: ${lead.name}, Company: ${lead.company}, Value: $${lead.value}, Notes: ${lead.notes}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { 
              type: Type.NUMBER, 
              description: "A lead quality score between 0 and 100 based on deal value and context" 
            },
            recommendation: { 
              type: Type.STRING, 
              description: "A one-sentence strategic recommendation for the next move" 
            }
          },
          required: ["score", "recommendation"]
        }
      }
    });
    
    if (response.text) {
      const data = JSON.parse(response.text);
      return `Quality Score: ${data.score}/100 — ${data.recommendation}`;
    }
    return "Score: N/A";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Score: N/A";
  }
};

export const fixGrammar = async (text: string) => {
  if (!text || text.trim().length < 5) return text;
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Fix grammar/spelling: "${text}". Return only fixed text.`,
    });
    return response.text?.trim() || text;
  } catch (error) {
    return text;
  }
};

export const suggestNextSteps = async (lead: Lead) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const historyText = lead.interactions.map(i => `[${i.type} on ${i.timestamp}]: ${i.content}`).join('\n');
  const prompt = `Based on the following lead info and history, suggest 2-3 specific next-step tasks.
  Lead: ${lead.name} at ${lead.company} (Stage: ${lead.stage})
  Notes: ${lead.notes}
  History: ${historyText}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              type: { 
                type: Type.STRING,
                description: "One of: Follow-up, Meeting, Call, Email, LinkedIn, Research"
              },
              priority: { 
                type: Type.STRING,
                description: "One of: High, Medium, Low"
              }
            },
            required: ["title", "type", "priority"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("AI Suggestion Error:", error);
    return [];
  }
};
