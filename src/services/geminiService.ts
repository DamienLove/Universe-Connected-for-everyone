// FIX: Replaced mock service with a real implementation using the @google/genai SDK.
import { GoogleGenAI } from "@google/genai";
import { GameNode, Chapter } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
let client: GoogleGenAI | null = null;
let initializationAttempted = false;
let initializationWarningLogged = false;

const ensureClient = () => {
  if (!API_KEY) {
    if (!initializationWarningLogged) {
      console.warn('Gemini API key is not configured. Falling back to offline copy for narrative text.');
      initializationWarningLogged = true;
    }
    return null;
  }

  if (!initializationAttempted) {
    initializationAttempted = true;
    try {
      client = new GoogleGenAI({ apiKey: API_KEY });
    } catch (error) {
      client = null;
      console.error('Failed to initialize Gemini client. Narrative content will use local fallbacks instead.', error);
    }
  }

  return client;
};

const formatConcept = (concept: string) => concept.replace(/_/g, ' ');

const offlineFlavorText = (concept: string) =>
  `"${formatConcept(concept)} hums softly within the cosmic web, waiting for consciousness to weave it into meaning."`;

const offlineLore = (node: GameNode, chapter: Chapter) =>
  `The ${formatConcept(node.label)} drifts through ${chapter.name.toLowerCase()}, carrying echoes of choices yet to be made.`;

export const getGeminiFlavorText = async (concept: string): Promise<string> => {
  const ai = ensureClient();
  if (!ai) {
    return offlineFlavorText(concept);
  }

  try {
    const prompt = `Create a short, poetic, and evocative flavor text for a concept in a cosmic evolution game. The concept is "${formatConcept(concept)}". The text should be a single sentence, enclosed in double quotes, and feel profound, like a line from a science fiction novel.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are a creative writer for a video game, specializing in cryptic and beautiful flavor text.",
        temperature: 0.8,
        topP: 0.9,
        maxOutputTokens: 60,
      },
    });

    const flavorText = response.text?.trim();
    if (!flavorText) {
      console.warn(`Gemini API returned no text for concept "${concept}". Using offline copy.`);
      return offlineFlavorText(concept);
    }

    if (flavorText.startsWith('"') && flavorText.endsWith('"')) {
      return flavorText;
    }

    return `"${flavorText}"`;
  } catch (error) {
    console.error(`Error fetching flavor text for "${concept}":`, error);
    return offlineFlavorText(concept);
  }
};

export const getGeminiLoreForNode = async (node: GameNode, chapter: Chapter): Promise<string> => {
  const ai = ensureClient();
  if (!ai) {
    return offlineLore(node, chapter);
  }

  try {
    const nodeDescription = `${node.label} (${formatConcept(node.type)})`;
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

    const loreText = response.text?.trim();
    if (!loreText) {
      console.warn(`Gemini API returned no lore for node "${node.label}". Using offline copy.`);
      return offlineLore(node, chapter);
    }

    return loreText;
  } catch (error) {
    console.error(`Error fetching lore for "${node.label}":`, error);
    return offlineLore(node, chapter);
  }
};

const MAX_RETRIES = 5;
const INITIAL_BACKOFF_MS = 1000;

export const generateNodeImage = async (prompt: string): Promise<string | null> => {
  const ai = ensureClient();
  if (!ai) {
    return null;
  }

  let retries = 0;
  while (retries < MAX_RETRIES) {
    try {
      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: '1:1',
        },
      });

      if (response.generatedImages && response.generatedImages.length > 0) {
        const imageBytes = response.generatedImages[0]?.image?.imageBytes;
        if (imageBytes) {
          return `data:image/png;base64,${imageBytes}`;
        }
      }
      console.warn('The image generation API did not return an image. This might be due to safety filters or a transient issue.');
      return null;
    } catch (error: any) {
      const errorMessage = (error?.toString?.() || '').toLowerCase();
      if (errorMessage.includes('429') || errorMessage.includes('resource_exhausted') || errorMessage.includes('quota')) {
        retries++;
        if (retries >= MAX_RETRIES) {
          console.error(`Error generating image after ${MAX_RETRIES} retries due to rate limiting.`, error);
          return null;
        }
        const delay = INITIAL_BACKOFF_MS * Math.pow(2, retries - 1) + Math.random() * 1000;
        console.warn(`Rate limit hit. Retrying in ${delay.toFixed(0)}ms... (Attempt ${retries}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('Error generating image:', error);
        return null;
      }
    }
  }
  return null;
};
