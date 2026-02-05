
import { GoogleGenAI } from "@google/genai";
import { Lead } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateFollowUpEmail = async (lead: Lead) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a professional sales assistant for a high-tech CRM company. Write a short, personalized follow-up LinkedIn message or email to ${lead.name} from ${lead.company}. They are currently at the "${lead.stage}" stage of the sales pipeline. Their interest is: ${lead.notes}. Make it catchy and human.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating content. Please try again later.";
  }
};

export const analyzeLeadQuality = async (lead: Lead) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the following lead data and provide a "Lead Quality Score" (1-100) and a one-sentence recommendation. Lead: Name: ${lead.name}, Company: ${lead.company}, Source: ${lead.source}, Value: $${lead.value}, Notes: ${lead.notes}. Output in format Score: [number] - [Reasoning]`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Score: N/A - Analysis unavailable.";
  }
};
