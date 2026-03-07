import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { invokeModalWorker } from '@/lib/worker/modal';
import { getUserBalance, deductCredits } from '@/lib/billing/credits';
import { Database } from '@/lib/supabase/types';
import { SupabaseClient } from '@supabase/supabase-js';

const supabase = supabaseAdmin as SupabaseClient<Database>;

/**
 * POST /api/jobs
 * Create a new video processing job (async)
 * 
 * Body:
 * {
 *   video_url: string;
 *   settings?: { clip_count?: number; duration_range?: [number, number]; aspect_ratio?: '9:16' | '16:9' | '1:1' }
 * }
 * 
 * Returns:
 * {
 *   job_id: string;
 *   status: 'queued';
 *   message: string;
 * }
 */
import { z } from 'zod';

const jobRequestSchema = z.object({
    video_url: z.string().url("Must be a valid video URL"),
    settings: z.object({
        clip_count: z.number().optional(),
        duration_range: z.tuple([z.number(), z.number()]).optional(),
        aspect_ratio: z.enum(['9:16', '16:9', '1:1']).optional(),
    }).optional(),
});

export async function POST(req: NextRequest) {
    try {
        // 1. Authenticate user
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // 2. Parse request body
        let rawBody;
        try {
            rawBody = await req.json();
        } catch {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        const parseResult = jobRequestSchema.safeParse(rawBody);

        if (!parseResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: parseResult.error.format() },
                { status: 400 }
            );
        }

        const { video_url, settings } = parseResult.data;

        // 3. Check user credit balance
        const balance = await getUserBalance(userId);

        // Assume an average YouTube video is at least 10 minutes for this check.
        // In reality, we should fetch YouTube metadata for exact length here, 
        // but to stay fast, we'll do a soft check and then deduct the real amount later.
        const minimumRequired = 10;

        if (balance < minimumRequired) {
            return NextResponse.json(
                { error: `Insufficient credits. You have ${balance} but need at least ${minimumRequired} to start a job.` },
                { status: 402 }
            );
        }

        // 4. Create job record in database
        const jobInsert: Database['public']['Tables']['jobs']['Insert'] = {
            user_id: userId,
            video_url,
            status: 'queued',
            settings: settings || null,
        };

        const { data: jobRecordRaw, error: dbError } = await supabase
            .from('jobs')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .insert(jobInsert as any) // Type assertion: table exists but TS cache needs refresh
            .select()
            .single();

        const jobRecord = (jobRecordRaw as unknown) as { id: string, settings: { project_id?: string } | null };

        if (dbError || !jobRecord) {
            console.error('[API] Failed to create job record:', dbError);
            return NextResponse.json(
                { error: 'Failed to create job' },
                { status: 500 }
            );
        }

        // 5. Hybrid Worker Pipeline (Async)
        (async () => {
            try {
                console.log(`[API] Starting Pipeline for job ${jobRecord.id}`);

                const useMockWorker = process.env.NODE_ENV === 'development' && !process.env.FORCE_MODAL;

                if (useMockWorker) {
                    // DEV MODE: Skip expensive download/upload, go straight to mock worker
                    console.log('[API] Dev mode detected: Using Mock Worker (skipping download)');
                    const { processJobMock } = await import('@/lib/worker/mock-worker');
                    processJobMock(
                        String(jobRecord.id),
                        video_url,
                        userId,
                        supabase
                    );
                } else {
                    // PRODUCTION / FORCE_MODAL: Full pipeline
                    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
                    let r2Url = undefined;
                    let filePath = undefined;

                    if (!isProduction) {
                        const { downloadVideoLocally, uploadToR2 } = await import('@/lib/video-downloader');

                        console.log('[API] Step 1: Downloading locally (Residential IP Bypass)...');
                        filePath = await downloadVideoLocally(video_url, String(jobRecord.id));

                        console.log('[API] Step 2: Uploading to R2...');
                        const r2Key = `raw/${jobRecord.id}.mp4`;
                        r2Url = await uploadToR2(filePath, r2Key);
                        console.log(`[API] R2 URL: ${r2Url}`);
                    } else {
                        console.log('[API] Production: Modal will download directly.');
                    }

                    console.log('[API] Step 3: Invoking Modal Worker...');
                    const modalParams = {
                        job_id: String(jobRecord.id),
                        project_id: jobRecord.settings?.project_id || '',
                        video_url,
                        settings: {
                            width: settings?.aspect_ratio === '1:1' ? 1080 : 1080,
                            height: settings?.aspect_ratio === '16:9' ? 1080 : 1920,
                            clip_count: settings?.clip_count || 3,
                            ...(r2Url ? { download_url: r2Url } : {})
                        },
                    };
                    await invokeModalWorker(modalParams);
                    console.log('[API] Modal invocation successful');

                    // Clean up temp file
                    if (filePath) {
                        const fs = await import('fs');
                        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                    }
                }

                // 5d. Deduct Credits
                // For now, we deduct a flat estimated amount of 10 credits.
                // In a perfect system, the worker would report the exact duration back
                // to the database and a webhook would handle the precise deduction.
                const estimatedCost = 10;
                await deductCredits(
                    userId,
                    estimatedCost,
                    'USAGE',
                    `Processed video (Job ${jobRecord.id})`,
                    String(jobRecord.id),
                    true // Force deduction even if it sends them slightly negative
                );
                console.log(`[API] Deducted ${estimatedCost} credits for Job ${jobRecord.id}`);

            } catch (error) {
                console.error('[API] Hybrid Pipeline failed:', error);
                // Update job status to failed
                const updateData = {
                    status: 'failed',
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    error: (error as any).message || 'Pipeline failed'
                };
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (supabase.from('jobs') as any)
                    .update(updateData)
                    .eq('id', jobRecord.id);
            }
        })();

        // 6. Return job ID immediately (202 Accepted - processing async)
        return NextResponse.json(
            {
                job_id: jobRecord.id,
                status: 'queued',
                message: 'Job queued successfully. Poll /api/jobs/{id} for status.',
            },
            { status: 202 }
        );

    } catch (error: unknown) {
        console.error('[API] Job creation error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/jobs
 * List user's jobs (paginated)
 */
export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get pagination params
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '10', 10);
        const offset = parseInt(searchParams.get('offset') || '0', 10);

        // Fetch user's jobs
        const { data: jobs, error } = await supabase
            .from('jobs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('[API] Failed to fetch jobs:', error);
            return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
        }

        return NextResponse.json({ jobs });

    } catch (error) {
        console.error('[API] Job list error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
