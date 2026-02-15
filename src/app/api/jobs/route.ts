import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { invokeModalWorker } from '@/lib/worker/modal';
import { Database } from '@/lib/supabase/types';

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
        const body = await req.json();
        const { video_url, settings } = body;

        if (!video_url || typeof video_url !== 'string') {
            return NextResponse.json(
                { error: 'video_url is required' },
                { status: 400 }
            );
        }

        // 3. TODO: Check user credit balance
        // const balance = await getCreditBalance(userId);
        // const estimatedCost = calculateVideoCost(video_url); // Based on duration
        // if (balance < estimatedCost) {
        //   return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
        // }

        // 4. Create job record in database
        const jobInsert: Database['public']['Tables']['jobs']['Insert'] = {
            user_id: userId,
            video_url,
            status: 'queued',
            settings: settings || null,
        };

        const { data: jobRecord, error: dbError } = await supabaseAdmin
            .from('jobs')
            .insert(jobInsert as any) // Type assertion: table exists but TS cache needs refresh
            .select()
            .single();

        if (dbError || !jobRecord) {
            console.error('[API] Failed to create job record:', dbError);
            return NextResponse.json(
                { error: 'Failed to create job' },
                { status: 500 }
            );
        }

        // 5. Hybrid Worker Pipeline (Async)
        // We run the download/upload locally to use residential IP, then invoke Modal
        (async () => {
            try {
                console.log(`[API] Starting Hybrid Pipeline for job ${(jobRecord as any).id}`);

                // Import dynamically to avoid top-level await issues if any
                const { downloadVideoLocally, uploadToR2 } = await import('@/lib/video-downloader');

                // 5a. Local Download (Bypasses YouTube blocking)
                console.log('[API] Step 1: Downloading locally...');
                const filePath = await downloadVideoLocally(video_url, (jobRecord as any).id);

                // 5b. Upload to R2
                console.log('[API] Step 2: Uploading to R2...');
                const r2Key = `raw/${(jobRecord as any).id}.mp4`;
                const r2Url = await uploadToR2(filePath, r2Key);
                console.log(`[API] R2 URL: ${r2Url}`);

                // 5c. Invoke Modal with R2 URL
                console.log('[API] Step 3: Invoking Modal Worker...');
                const modalParams = {
                    job_id: (jobRecord as any).id,
                    project_id: (jobRecord as any).settings?.project_id || '',
                    video_url, // Keep original URL for metadata
                    settings: {
                        width: settings?.aspect_ratio === '1:1' ? 1080 : 1080,
                        height: settings?.aspect_ratio === '16:9' ? 1080 : 1920,
                        clip_count: settings?.clip_count || 3,
                        download_url: r2Url, // Pass the R2 URL
                    },
                };

                await invokeModalWorker(modalParams);
                console.log('[API] Modal invocation successful');

                // Clean up temp file
                const fs = await import('fs');
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }

            } catch (error: any) {
                console.error('[API] Hybrid Pipeline failed:', error);
                // Update job status to failed
                await supabaseAdmin
                    .from('jobs')
                    .update({
                        status: 'failed',
                        error: error.message || 'Pipeline failed'
                    } as any)
                    .eq('id', (jobRecord as any).id);
            }
        })();

        // 6. Return job ID immediately (202 Accepted - processing async)
        return NextResponse.json(
            {
                job_id: (jobRecord as any).id,
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
        const { data: jobs, error } = await supabaseAdmin
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
