import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { enqueueVideoJob, type VideoJob } from '@/lib/queue/redis';
import { Database } from '@/lib/supabase/types';

type JobInsert = Database['public']['Tables']['jobs']['Insert'];

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
        const jobInsert: JobInsert = {
            user_id: userId,
            video_url,
            status: 'queued',
            settings: settings || null,
        };

        const { data: jobRecord, error: dbError } = await supabaseAdmin
            .from('jobs')
            .insert(jobInsert)
            .select()
            .single();

        if (dbError || !jobRecord) {
            console.error('[API] Failed to create job record:', dbError);
            return NextResponse.json(
                { error: 'Failed to create job' },
                { status: 500 }
            );
        }

        // 5. Enqueue job to Redis
        const queueJob: VideoJob = {
            id: jobRecord.id,
            user_id: userId,
            video_url,
            settings: settings || undefined,
            created_at: new Date().toISOString(),
            retry_count: 0,
        };

        await enqueueVideoJob(queueJob);

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
