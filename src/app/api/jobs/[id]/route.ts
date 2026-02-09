import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/jobs/[id]
 * Get status of a specific job
 * 
 * Returns:
 * {
 *   id: string;
 *   status: 'queued' | 'processing' | 'completed' | 'failed';
 *   created_at: string;
 *   updated_at: string;
 *   result_url?: string;
 *   error?: string;
 * }
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Fetch job details
        const { data: job, error } = await supabaseAdmin
            .from('jobs')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (error || !job) {
            return NextResponse.json(
                { error: 'Job not found' },
                { status: 404 }
            );
        }

        // Return minimal status info
        return NextResponse.json({
            id: job.id,
            status: job.status,
            created_at: job.created_at,
            updated_at: job.updated_at,
            result_url: job.result_url || null,
            error: job.error || null,
            settings: job.settings || null,
        });

    } catch (error) {
        console.error('[API] Job status error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
