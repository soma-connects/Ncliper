import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types';
import { saveClipEmbedding } from '@/lib/video/embeddings';

/**
 * Mock Worker Service
 * Simulates the backend video processing pipeline for local development
 * Updates job status and creates "fake" viral clips
 */

const MOCK_DELAY_MS = 3000; // 3 seconds per step

export async function processJobMock(
    jobId: string,
    videoUrl: string,
    userId: string,
    supabase: SupabaseClient<Database>
) {
    console.log(`[MockWorker] Starting job ${jobId} for user ${userId}`);

    try {
        // Step 1: Downloading
        await updateJobStatus(supabase, jobId, 'processing', 'Downloading video...');
        await delay(MOCK_DELAY_MS);

        // Step 2: Analyzing (The "Virality Strategist" phase)
        await updateJobStatus(supabase, jobId, 'processing', 'Analyzing virality patterns...');
        await delay(MOCK_DELAY_MS);

        // Step 3: Generating Clips
        await updateJobStatus(supabase, jobId, 'processing', 'Rendering viral clips...');
        await delay(MOCK_DELAY_MS);

        // Create Mock Clips
        const clips = generateMockClips(jobId, videoUrl);

        // Insert Clips into DB
        // We need to fetch back the inserted clips to get their generated UUIDs
        const response = await supabase
            .from('clips')
            .insert(clips.map(clip => ({
                ...clip,
                // The clips table requires a project_id. If we don't have one, 
                // we'll need to use a dummy or let the DB fail if it's strictly required
                project_id: '00000000-0000-0000-0000-000000000000' // Stub project UUID to satisfy constraint
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            })) as any)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .select() as { data: any[] | null, error: any };

        const insertedClips = response.data;
        const clipError = response.error;

        if (clipError || !insertedClips) throw new Error(`Failed to insert clips: ${clipError?.message}`);

        console.log(`[MockWorker] Generating Semantic Search Embeddings for ${insertedClips.length} clips...`);
        for (const insertedClip of insertedClips) {
            const transcriptText = insertedClip.transcript_segment ? JSON.stringify(insertedClip.transcript_segment) : (insertedClip.description || insertedClip.title || "");
            await saveClipEmbedding(insertedClip.id, transcriptText);
        }

        // Step 4: Complete
        await updateJobStatus(supabase, jobId, 'completed', 'Job finished successfully.');
        console.log(`[MockWorker] Job ${jobId} completed!`);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error(`[MockWorker] Job ${jobId} failed:`, error);
        await updateJobStatus(supabase, jobId, 'failed', error.message);
    }
}

async function updateJobStatus(
    supabase: SupabaseClient<Database>,
    jobId: string,
    status: 'queued' | 'processing' | 'completed' | 'failed',
    message?: string
) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('jobs') as any)
        .update({ status, message })
        .eq('id', jobId);
}

function delay(ms: number) {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
}

function generateMockClips(jobId: string, originalVideoUrl: string) {
    // Generate 3 "Hormozi-style" viral clips conforming to actual DB schema
    return [
        {
            title: "The Pattern Interrupt",
            video_url: originalVideoUrl,
            start_time: 15.5,
            end_time: 45.2,
            virality_score: 95,
            transcript_segment: {
                text: "High-retention hook detected at 0:15",
                type: 'Pattern Interrupt',
                duration: 29.7
            }
        },
        {
            title: "The Value Bomb",
            video_url: originalVideoUrl,
            start_time: 120.0,
            end_time: 155.0,
            virality_score: 88,
            transcript_segment: {
                text: "Core actionable advice extracted",
                type: 'Value Bomb',
                duration: 35.0
            }
        },
        {
            title: "Curiosity Gap",
            video_url: originalVideoUrl,
            start_time: 0.0,
            end_time: 60.0,
            virality_score: 92,
            transcript_segment: {
                text: "Merged intro and conclusion for maximum retention",
                type: 'Curiosity Gap',
                duration: 45.0
            }
        }
    ];
}
