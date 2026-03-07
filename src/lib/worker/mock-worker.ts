import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types';
import { saveClipEmbedding } from '@/lib/video/embeddings';
import { z } from 'zod';

const ClipInsertSchema = z.object({
    project_id: z.string().uuid(),
    title: z.string(),
    start_time: z.number(),
    end_time: z.number(),
    video_url: z.string().nullable().optional(),
    virality_score: z.number().nullable().optional(),
    transcript_segment: z.any().nullable().optional()
});

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

        // Step 2: Analyzing \& Create Project
        await updateJobStatus(supabase, jobId, 'processing', 'Analyzing virality patterns...');

        // Create a real project to satisfy the foreign key constraint
        const { data, error: projectError } = await supabase
            .from('projects')
            .insert({
                user_id: userId,
                title: `Mock Project - Job ${jobId.slice(0, 6)}`,
                video_url: videoUrl,
                status: 'completed'
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any)
            .select('id')
            .single();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const projectData = data as any;

        if (projectError || !projectData) {
            throw new Error(`Failed to create project: ${projectError?.message}`);
        }

        await delay(MOCK_DELAY_MS);

        // Step 3: Generating Clips
        await updateJobStatus(supabase, jobId, 'processing', 'Rendering viral clips...');
        await delay(MOCK_DELAY_MS);

        // Create Mock Clips
        const clips = generateMockClips(jobId, videoUrl);

        // Insert Clips into DB
        // Zod stripping prevents ANY extra fields from causing Postgres constraint errors
        const validatedClips = clips.map(clip => {
            const parsed = ClipInsertSchema.safeParse({
                ...clip,
                project_id: projectData.id
            });
            if (!parsed.success) {
                console.error('[MockWorker] Invalid clip data:', parsed.error);
                throw new Error(`Invalid mock clip data generated: ${parsed.error.message}`);
            }
            return parsed.data;
        });

        const response = await supabase
            .from('clips')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .insert(validatedClips as any)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .select() as { data: any[] | null, error: any };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const insertedClips = response.data as any[] | null;
        const clipError = response.error;

        if (clipError || !insertedClips) throw new Error(`Failed to insert clips: ${clipError?.message}`);

        console.log(`[MockWorker] Generating Semantic Search Embeddings for ${insertedClips.length} clips...`);
        try {
            for (const insertedClip of insertedClips) {
                const transcriptText = insertedClip.transcript_segment ? JSON.stringify(insertedClip.transcript_segment) : (insertedClip.title || "");
                await saveClipEmbedding(insertedClip.id, transcriptText);
            }
        } catch (embedError) {
            console.warn(`[MockWorker] Non-fatal error during embedding generation:`, embedError);
            // We intentionally do not throw here, as the clips were already successfully saved.
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
    _message?: string
) {
    // NOTE: The 'jobs' table does NOT have a 'message' column.
    // Only update 'status' to avoid silent Supabase errors.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('jobs') as any)
        .update({ status })
        .eq('id', jobId);

    if (error) {
        console.error(`[MockWorker] Failed to update job ${jobId} to ${status}:`, error.message);
    } else {
        console.log(`[MockWorker] Updated job ${jobId} → ${status}`);
    }
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
