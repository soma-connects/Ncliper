import 'server-only';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// Ensure API Key is present in environment variables
const API_KEY = process.env.GOOGLE_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

// Define the schema using SchemaType enums for robustness
const hookSchema = {
    description: "List of viral hooks found in the video",
    type: SchemaType.ARRAY,
    items: {
        type: SchemaType.OBJECT,
        properties: {
            // Overall bounds (min start, max end of the sequence)
            start_time: {
                type: SchemaType.NUMBER,
                description: "Start time of the entire sequence in seconds",
                nullable: false,
            },
            end_time: {
                type: SchemaType.NUMBER,
                description: "End time of the entire sequence in seconds",
                nullable: false,
            },
            // Specific segments to stitch together
            segments: {
                type: SchemaType.ARRAY,
                description: "List of specific time ranges to stitch together to form this hook",
                items: {
                    type: SchemaType.OBJECT,
                    properties: {
                        start: { type: SchemaType.NUMBER, nullable: false },
                        end: { type: SchemaType.NUMBER, nullable: false }
                    },
                    required: ["start", "end"]
                },
                nullable: false
            },
            virality_score: {
                type: SchemaType.NUMBER,
                description: "Score from 0 to 100 indicating viral potential",
                nullable: false,
            },
            type: {
                type: SchemaType.STRING,
                description: "Type of hook detected: 'Pattern Interrupt', 'High-Retention Hook', etc.",
                nullable: false
            }
        },
        required: ["start_time", "end_time", "segments", "virality_score", "type"],
    },
};


// eslint-disable-next-line @typescript-eslint/no-explicit-any
const generateWithRetry = async (model: any, prompt: string, retries = 3, delay = 1000): Promise<any> => {
    try {
        return await model.generateContent(prompt);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        if (retries > 0 && (error.status === 429 || error.message?.includes('429'))) {
            let waitTime = delay;

            // Attempt to extract specific retry delay from error details
            if (error.errorDetails) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const retryInfo = error.errorDetails.find((d: any) =>
                    d['@type']?.includes('RetryInfo') || d.retryDelay
                );
                if (retryInfo && retryInfo.retryDelay) {
                    const seconds = parseFloat(retryInfo.retryDelay.replace('s', ''));
                    if (!isNaN(seconds)) {
                        waitTime = Math.ceil(seconds * 1000) + 1000; // Add 1s buffer
                    }
                }
            }

            // Safety: If wait time is > 20s, fail fast to avoid serverless timeouts
            if (waitTime > 20000) {
                console.error(`Gemini Rate Limit. Required wait ${waitTime}ms exceeds timeout safety.`);
                throw new Error(`Rate limit exceeded. Please try again in ${Math.ceil(waitTime / 1000)} seconds.`);
            }

            console.warn(`Gemini API 429 Rate Limit. Retrying in ${waitTime}ms... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            return generateWithRetry(model, prompt, retries - 1, delay * 2);
        }
        throw error;
    }
};

export const analyzeTranscript = async (transcript: string) => {
    if (!API_KEY) {
        console.warn("GOOGLE_API_KEY is not set. Returning mock data.");
        // Mock data for development if key is missing
        return JSON.stringify([
            {
                start_time: 0, end_time: 20,
                segments: [{ start: 0, end: 5 }, { start: 15, end: 20 }],
                virality_score: 85, type: "Pattern Interrupt"
            }
        ]);
    }

    try {
        // Optimized Strategy:
        // 1. Try 'gemini-2.0-flash' (Standard, usually has better free tier availability than Lite)
        // 2. Fallback to 'gemini-flash-latest' (Valid alias for stable Flash model)

        const primaryModelName = "gemini-2.0-flash";
        const fallbackModelName = "gemini-flash-latest";

        const primaryModel = genAI.getGenerativeModel({
            model: primaryModelName,
            generationConfig: {
                responseMimeType: "application/json",
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                responseSchema: hookSchema as any,
            }
        });

        const prompt = `
  You are a Viral Content Strategist for Ncliper. Analyze this transcript to find exactly 3 viral segments suitable for Long-Form Shorts/Reels.
  
  CRITICAL "INTELLIGENT MERGING" RULES:
  - You can (and should) MERGE disparate parts of the video if they form a stronger narrative.
  - Example: A video has a Setup (0:00-0:30), then boring fluff, then a Payoff (2:00-2:30).
  - Return this as ONE hook with \`segments: [{start: 0, end: 30}, {start: 120, end: 150}]\`.
  - The total duration of all segments combined must be between 60 and 180 seconds.

  **VIRALITY RUBRIC (Scoring 0-100):**
  1. **Hook Strength (40%)**: Does the first 3 seconds grab attention? (e.g. "I almost died...", "You won't believe...", "The secret to...")
  2. **Pacing (30%)**: Is the content dense? (Remove pauses, filler words, slow transitions = High Pacing)
  3. **Emotional/Intellectual Value (30%)**: Does it trigger curiosity, anger, awe, or provide high utility?

  **PRECISION RULE**: 
  - Segments MUST start at the beginning of a complete sentence or a clear visual cut. 
  - Do NOT start mid-sentence. 
  - Verify timestamp precision to 0.1s.

  Content Types:
  1. "The Deep Dive": Explain a concept fully. (Hormozi Style: Hook -> Value -> Value -> CTA)
  2. "The Story Arc": Setup -> Conflict -> Resolution. (MrBeast Style: High stakes immediately)
  3. "The Contrarian Argument": Premise -> Evidence -> Conclusion.

  Transcript: "${transcript.slice(0, 20000)}" 
  
  Return ONLY a JSON array following the requested schema. Ensure \`segments\` contains the precise cuts.
  
  [Random Seed: ${Math.random()}]
`;

        try {
            console.log(`Analyzing with ${primaryModelName}...`);
            // Reduce retries to 1 for the primary to avoid burning quota instantly
            const result = await generateWithRetry(primaryModel, prompt, 1);
            return result.response.text();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.warn(`${primaryModelName} failed/overloaded. Falling back to ${fallbackModelName}...`, error.message);

            // Fallback Model
            const fallbackModel = genAI.getGenerativeModel({
                model: fallbackModelName,
                generationConfig: {
                    responseMimeType: "application/json",
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    responseSchema: hookSchema as any,
                }
            });

            // Try fallback with 1 retry as well
            const result = await generateWithRetry(fallbackModel, prompt, 1);
            return result.response.text();
        }

    } catch (error: any) {
        console.error("Virality Engine Error:", error);
        throw new Error(error.message || "Failed to analyze transcript");
    }
};
