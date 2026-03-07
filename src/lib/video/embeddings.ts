import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabaseAdmin } from '@/lib/supabase/server';
import { Database } from '@/lib/supabase/types';
import { SupabaseClient } from '@supabase/supabase-js';

const supabase = supabaseAdmin as SupabaseClient<Database>;

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

// Use the current embedding model (text-embedding-004 was shut down Jan 2026)
const EMBEDDING_MODEL = "gemini-embedding-001";

/**
 * Generate a 768-dimensional vector embedding for a given text string.
 */
export async function generateTextEmbedding(text: string): Promise<number[] | null> {
    try {
        if (!text || text.trim() === '') return null;

        const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
        const result = await model.embedContent(text);

        const embedding = result.embedding.values;
        if (!embedding || embedding.length === 0) {
            console.error('[Embeddings] Invalid embedding returned from Gemini');
            return null;
        }

        return embedding;
    } catch (error) {
        console.error('[Embeddings] Failed to generate embedding:', error);
        return null;
    }
}

/**
 * Saves a clip's embedding to the Supabase `embeddings` table.
 */
export async function saveClipEmbedding(clipId: string, transcriptText: string): Promise<boolean> {
    try {
        const embedding = await generateTextEmbedding(transcriptText);
        if (!embedding) return false;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from('embeddings') as any)
            .upsert({
                clip_id: clipId,
                embedding: embedding,
                transcript_text: transcriptText
            }, { onConflict: 'clip_id' });

        if (error) {
            console.error(`[Embeddings] Failed to save embedding for clip ${clipId}:`, error);
            return false;
        }

        return true;
    } catch (error) {
        console.error(`[Embeddings] Error saving clip embedding:`, error);
        return false;
    }
}

/**
 * Perform a semantic search query against the user's clips.
 */
export async function searchSemanticClips(query: string, userId: string, threshold = 0.5, limit = 10) {
    try {
        // 1. Generate an embedding for the user's search query
        const queryEmbedding = await generateTextEmbedding(query);
        if (!queryEmbedding) {
            return { error: 'Failed to understand search query' };
        }

        // 2. Call the Supabase RPC function (match_clips) using vector cosine ops
        // Convert the number array to a pgvector string format '[0.1, 0.2, ...]'
        const vectorString = `[${queryEmbedding.join(',')}]`;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: matches, error } = await (supabaseAdmin.rpc as any)('match_clips', {
            query_embedding: vectorString,
            match_threshold: threshold,
            match_count: limit,
            user_uid: userId
        });

        if (error) {
            console.error('[Embeddings] RPC Search Error:', error);
            return { error: 'Search failed on database' };
        }

        return { clips: matches || [] };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('[Embeddings] Semantic search error:', error);
        return { error: error.message || 'Search execution failed' };
    }
}
