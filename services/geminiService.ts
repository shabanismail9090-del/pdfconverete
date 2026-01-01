import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please ensure process.env.API_KEY is set.");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Uses Gemini to take raw, potentially messy text extracted from a PDF
 * and reformat it into clean Markdown, preserving structure.
 */
export const formatTextWithGemini = async (rawText: string): Promise<string> => {
  const ai = getClient();
  
  // Truncate if too long for a single pass demo (simplified logic)
  // In a production app, we would chunk this.
  const contentToProcess = rawText.length > 25000 ? rawText.slice(0, 25000) + "\n\n[...Truncated for Demo...]" : rawText;

  const prompt = `
    You are a professional document formatter. 
    I have text extracted from a PDF using OCR. The lines might be broken, paragraphs might be split, and headers might be plain text.
    
    Your task:
    1. Reconstruct the logical flow of the text (join broken lines).
    2. Identify headers and mark them with Markdown (# for Title, ## for H1, ### for H2).
    3. Fix common OCR typos if obvious.
    4. Maintain the original language (Arabic/English).
    5. Return ONLY the clean Markdown content. Do not add conversational filler.
    
    Here is the raw text:
    ---------------------
    ${contentToProcess}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.3, // Low temperature for consistent formatting
      }
    });

    return response.text || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("فشل في معالجة النص باستخدام الذكاء الاصطناعي");
  }
};