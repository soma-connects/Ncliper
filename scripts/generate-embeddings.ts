import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const geminiKey = process.env.GEMINI_API_KEY;

if (!supabaseUrl || !supabaseKey || !geminiKey) {
    console.error('Missing required environment variables (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenAI({ apiKey: geminiKey });

async function generateEmbedding(text: string): Promise<number[] | null> {
    try {
        const response = await genAI.models.embedContent({
            model: 'text-embedding-004',
            contents: text,
            config: { taskType: "SEMANTIC_SIMILARITY" }
        });
        return response.embeddings?.[0]?.values || null;
    } catch (e) {
        console.error("Gemini Error:", e);
        return null;
    }
}

async function backfillEmbeddings() {
    console.log("Starting embedding backfill...");

    // 1. Fetch all clips
    const { data: clips, error: fetchError } = await supabase
        .from('clips')
        .select('*');

    if (fetchError || !clips) {
        console.error("Failed to fetch clips:", fetchError);
        return;
    }

    console.log(`Found ${clips.length} clips to process.`);

    // 2. Process each clip
    let successCount = 0;
    for (const clip of clips) {
        // Extract transcript text. Depending on how it's saved, it might be a string or JSON.
        // For MVP, we'll try to use transcript_segment or fallback to description/title.
        let textToEmbed = "";

        if (clip.transcript_segment) {
            if (typeof clip.transcript_segment === 'string') {
                textToEmbed = clip.transcript_segment;
            } else if (Array.isArray(clip.transcript_segment)) {
                // Try to map assuming standard array of {text} objects
                try {
                    textToEmbed = clip.transcript_segment.map((s: any) => s.text || s.utf8 || "").join(" ");
                } catch (e) { }
            }
        }

        if (!textToEmbed || textToEmbed.trim() === "") {
            // Fallback to title
            textToEmbed = clip.title || "Untitled Video Clip";
        }

        console.log(`Generating embedding for clip ${clip.id} ("${clip.title}")...`);
        const vector = await generateEmbedding(textToEmbed);

        if (vector) {
            // Upsert into embeddings table
            const { error: upsertError } = await supabase
                .from('embeddings')
                .upsert({
                    clip_id: clip.id,
                    embedding: vector,
                    transcript_text: textToEmbed
                }, { onConflict: 'clip_id' } as any);

            if (upsertError) {
                console.error(`Failed to save embedding for ${clip.id}:`, upsertError.message);
            } else {
                console.log(`✅ Saved embedding for ${clip.id}`);
                successCount++;
            }
        } else {
            console.error(`❌ Failed to generate vector for ${clip.id}`);
        }

        // Sleep briefly to avoid hitting Gemini rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\nBackfill complete. Successfully processed ${successCount} out of ${clips.length} clips.`);
}

backfillEmbeddings().catch(console.error);
