import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types';

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
        const { error: clipError } = await supabase
            .from('clips')
            .insert(clips.map(clip => ({
                ...clip,
                user_id: userId, // Ensure ownership
                job_id: jobId,
                project_id: null // optional for now
            })) as any);

        if (clipError) throw new Error(`Failed to insert clips: ${clipError.message}`);

        // Step 4: Complete
        await updateJobStatus(supabase, jobId, 'completed', 'Job finished successfully.');
        console.log(`[MockWorker] Job ${jobId} completed!`);

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
    await supabase
        .from('jobs')
        .update({ status, message } as any)
        .eq('id', jobId);
}

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function generateMockClips(jobId: string, originalVideoUrl: string) {
    // Generate 3 "Hormozi-style" viral clips
    return [
        {
            title: "The Pattern Interrupt",
            description: "High-retention hook detected at 0:15",
            video_url: originalVideoUrl, // Use original for now, backend would be R2 URL
            thumbnail_url: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80",
            start_time: 15.5,
            end_time: 45.2,
            duration: 29.7,
            virality_score: 95,
            status: 'completed',
            type: 'Pattern Interrupt',
            segments: JSON.stringify([{ start: 15.5, end: 45.2 }])
        },
        {
            title: "The Value Bomb",
            description: "Core actionable advice extracted",
            video_url: originalVideoUrl,
            thumbnail_url: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=800&q=80",
            start_time: 120.0,
            end_time: 155.0,
            duration: 35.0,
            virality_score: 88,
            status: 'completed',
            type: 'Value Bomb',
            segments: JSON.stringify([{ start: 120.0, end: 155.0 }])
        },
        {
            title: "Curiosity Gap",
            description: "Merged intro and conclusion for maximum retention",
            video_url: originalVideoUrl, // In real app, this would be the stitched clip URL
            thumbnail_url: "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=800&q=80",
            start_time: 0.0,
            end_time: 60.0,
            duration: 45.0,
            virality_score: 92,
            status: 'completed',
            type: 'Curiosity Gap',
            segments: JSON.stringify([{ start: 0, end: 15 }, { start: 280, end: 310 }])
        }
    ];
}
