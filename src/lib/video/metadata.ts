import 'server-only';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const API_KEY = process.env.GOOGLE_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

const metadataSchema = {
    description: "Metadata for video clip",
    type: SchemaType.OBJECT,
    properties: {
        title: {
            type: SchemaType.STRING,
            description: "A viral, catchy, clickbait-style title for the video clip (under 60 chars)",
            nullable: false,
        },
        thumbnail_prompt: {
            type: SchemaType.STRING,
            description: "A highly detailed visual description of a YouTube thumbnail for this clip. Describe the subject, emotion, background, and lighting.",
            nullable: false,
        }
    },
    required: ["title", "thumbnail_prompt"],
};

// Duplicating retry utility to avoid circular deps for now
// Ideally this moves to src/lib/ai/client.ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const generateWithRetry = async (model: any, prompt: string, retries = 3, delay = 1000): Promise<any> => {
    try {
        return await model.generateContent(prompt);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        if (retries > 0 && (error.status === 429 || error.message?.includes('429'))) {
            let waitTime = delay;
            if (error.errorDetails) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const retryInfo = error.errorDetails.find((d: any) =>
                    d['@type']?.includes('RetryInfo') || d.retryDelay
                );
                if (retryInfo && retryInfo.retryDelay) {
                    const seconds = parseFloat(retryInfo.retryDelay.replace('s', ''));
                    if (!isNaN(seconds)) {
                        waitTime = Math.ceil(seconds * 1000) + 1000;
                    }
                }
            }
            console.warn(`Gemini API 429 (Metadata). Retrying in ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            return generateWithRetry(model, prompt, retries - 1, delay * 2);
        }
        throw error;
    }
};

export const generateClipMetadata = async (transcript: string) => {
    if (!API_KEY) {
        return JSON.stringify({
            title: "Mock Title: Amazing Video",
            thumbnail_prompt: "A person looking surprised with a colorful background."
        });
    }

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-lite",
            generationConfig: {
                responseMimeType: "application/json",
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                responseSchema: metadataSchema as any,
            }
        });

        const prompt = `
            You are a YouTube Expert. Analyze this transcript and generate:
            1. A viral, click-worthy title (short, punchy, under 60 chars). 
               - Use "Curiosity Gaps" (e.g., "The Secret to...", "Why I Stopped...").
               - Use "Negative Bias" (e.g., "Don't Do This...", "The Mistake That...").
            2. A detailed visual prompt for an AI image generator to create a thumbnail.
               - Style: Photorealistic, 8k, High Contrast, YouTube Thumbnail Style.
               - Content: Close-up of face with strong emotion (Surprise, Fear, Joy) OR High contrast object.
               - Lighting: Cinematic, Dramatic.
            
            Transcript: "${transcript.slice(0, 10000)}"
        `;

        const result = await generateWithRetry(model, prompt);
        return result.response.text();

    } catch (error) {
        console.error("Metadata Generation Error:", error);
        throw new Error("Failed to generate metadata");
    }
};
