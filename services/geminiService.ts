// FIX: Replaced mock service with a real implementation using the @google/genai SDK.
import { GoogleGenAI } from "@google/genai";

// Always use new GoogleGenAI({apiKey: process.env.API_KEY});
// The API key MUST be obtained exclusively from the environment variable `process.env.API_KEY`.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const getGeminiFlavorText = async (concept: string): Promise<string> => {
  try {
    const prompt = `Create a short, poetic, and evocative flavor text for a concept in a cosmic evolution game. The concept is "${concept.replace(/_/g, ' ')}". The text should be a single sentence, enclosed in double quotes, and feel profound, like a line from a science fiction novel. For example, for "panspermia", you might write: "Life is a traveler. It journeys across the void on ships of ice and rock, seeking fertile ground to continue its endless story."`;

    // Use ai.models.generateContent to query the model.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Use the recommended model for general text tasks.
      contents: prompt,
      config: {
        // A system instruction to guide the model's tone and style.
        systemInstruction: "You are a creative writer for a video game, specializing in cryptic and beautiful flavor text.",
        temperature: 0.8,
        topP: 0.9,
        maxOutputTokens: 60, // Flavor text should be concise.
      },
    });

    // Extract the text directly from the response's .text property.
    const flavorText = response.text.trim();
    
    // A simple check to ensure the output is in the desired format (starts and ends with a quote).
    if (flavorText.startsWith('"') && flavorText.endsWith('"')) {
        return flavorText;
    }

    // Fallback if the model doesn't follow instructions perfectly.
    return `"${flavorText}"`;

  } catch (error) {
    console.error(`Error fetching flavor text for "${concept}":`, error);
    // Return a default or fallback text on error.
    return '"The cosmos is not a collection of isolated objects but a vast and intricate web of interconnectedness."';
  }
};
