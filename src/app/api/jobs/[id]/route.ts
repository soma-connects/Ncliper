import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { Database } from '@/lib/supabase/types';
import { SupabaseClient } from '@supabase/supabase-js';

const supabase = supabaseAdmin as SupabaseClient<Database>;

/**
 * GET /api/jobs/[id]
 * Get status of a specific job
 * 
 * Returns:
 * {
 *   id: string;
 *   status: 'queued' | 'processing' | 'completed' | 'failed';
 *   created_at: string;
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
        const { data, error } = await supabase
            .from('jobs')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (error || !data) {
            return NextResponse.json(
                { error: 'Job not found' },
                { status: 404 }
            );
        }

        // Type the job properly
        const job: Database['public']['Tables']['jobs']['Row'] = data;

        // Return job status with result_data
        return NextResponse.json({
            id: job.id,
            status: job.status,
            created_at: job.created_at,
            result_data: job.result_data || null, // Return processed clips when complete
            result_url: (job.result_data as any)?.result_url || null, // Legacy field
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
