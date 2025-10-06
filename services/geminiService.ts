// FIX: Replaced mock service with a real implementation using the @google/genai SDK.
import { GoogleGenAI } from "@google/genai";
import { GameNode, Chapter } from '../types';


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

    // Safely access the text property to prevent runtime errors.
    const flavorText = response.text;
    
    if (!flavorText) {
      console.warn(`Gemini API returned no text for concept "${concept}". This might be due to content filtering.`, response);
      // Provide a graceful fallback.
      return '"The universal archives on this topic are mysteriously empty."';
    }

    const trimmedText = flavorText.trim();
    
    // A simple check to ensure the output is in the desired format (starts and ends with a quote).
    if (trimmedText.startsWith('"') && trimmedText.endsWith('"')) {
        return trimmedText;
    }

    // Fallback if the model doesn't follow instructions perfectly.
    return `"${trimmedText}"`;

  } catch (error) {
    console.error(`Error fetching flavor text for "${concept}":`, error);
    // Return a default or fallback text on error.
    return '"The cosmos is not a collection of isolated objects but a vast and intricate web of interconnectedness."';
  }
};


export const getGeminiLoreForNode = async (node: GameNode, chapter: Chapter): Promise<string> => {
    try {
        const nodeDescription = `${node.label} (${node.type.replace(/_/g, ' ')})`;
        const prompt = `You are the Universal Consciousness from Damien Nichols' book 'Universe Connected for Everyone'. A player is observing a cosmic entity: ${nodeDescription}. The universe is currently in the narrative chapter titled "${chapter.name}". Provide a short, profound, and slightly cryptic observation about this entity in the context of this chapter's themes. The response should be one or two sentences and not enclosed in quotes.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: "You are the narrator of a profound cosmic simulation game, speaking with wisdom and a touch of mystery.",
                temperature: 0.9,
                topP: 0.95,
                maxOutputTokens: 80,
            }
        });
        
        const loreText = response.text;
        if (!loreText) {
            console.warn(`Gemini API returned no lore for node "${node.label}".`, response);
            return "The connection is weak... The future is clouded.";
        }

        return loreText.trim();

    } catch (error) {
        console.error(`Error fetching lore for "${node.label}":`, error);
        return "The connection is weak... The future is clouded.";
    }
};

const MAX_RETRIES = 5;
const INITIAL_BACKOFF_MS = 1000;

export const generateNodeImage = async (prompt: string): Promise<string | null> => {
    let retries = 0;
    while (retries < MAX_RETRIES) {
        try {
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: prompt,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/png', // Use PNG for potential transparency
                    aspectRatio: '1:1',
                },
            });

            if (response.generatedImages && response.generatedImages.length > 0) {
                const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
                return `data:image/png;base64,${base64ImageBytes}`;
            }
            console.warn("The image generation API did not return an image. This might be due to safety filters or a transient issue.");
            return null; // Successful response but no image, so we don't retry.
        } catch (error: any) {
            // Check if it is a rate-limiting error by inspecting the error message.
            const errorMessage = (error.toString() || '').toLowerCase();
            if (errorMessage.includes('429') || errorMessage.includes('resource_exhausted') || errorMessage.includes('quota')) {
                retries++;
                if (retries >= MAX_RETRIES) {
                    console.error(`Error generating image after ${MAX_RETRIES} retries due to rate limiting.`, error);
                    return null; // Max retries reached
                }
                // Calculate delay with exponential backoff and add random jitter
                const delay = INITIAL_BACKOFF_MS * Math.pow(2, retries - 1) + Math.random() * 1000;
                console.warn(`Rate limit hit. Retrying in ${delay.toFixed(0)}ms... (Attempt ${retries}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                // Not a rate-limiting error, so we fail immediately.
                console.error(`Error generating image:`, error);
                return null;
            }
        }
    }
    // Should not be reached, but as a fallback.
    return null;
};