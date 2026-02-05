import 'server-only';
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GOOGLE_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);



// Redoing with a more likely working implementation for the specific model
export const generateImage = async (prompt: string) => {
    if (!API_KEY) return null;

    // Use the experimental model that supports image generation
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;

        // Inspect candidates for inline data (Base64 image)
        if (response.candidates && response.candidates.length > 0) {
            const candidate = response.candidates[0];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const parts = candidate.content.parts as any[];

            // Look for inlineData part
            const imagePart = parts.find(p => p.inlineData);

            if (imagePart && imagePart.inlineData) {
                const base64Data = imagePart.inlineData.data;
                const mimeType = imagePart.inlineData.mimeType || 'image/png';
                return `data:${mimeType};base64,${base64Data}`;
            }
        }

        console.warn("No image data found in Gemini response");
        return null;
    } catch (e) {
        console.error("Image Gen failed", e);
        // Don't throw, just return null so UI handles it gracefully
        return null;
    }
}
