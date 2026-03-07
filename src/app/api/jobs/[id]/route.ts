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

        // When job is completed, fetch the actual clips from the clips table
        let resultData = job.result_data || null;

        if (job.status === 'completed' && !resultData) {
            // The mock worker (and production worker) store clips in the `clips` table
            // linked via a `project`. We need to find the project created for this job.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: projects } = await (supabase
                .from('projects')
                .select('id, title')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1) as any);

            if (projects && projects.length > 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const project = projects[0] as any;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data: clips } = await (supabase
                    .from('clips')
                    .select('*')
                    .eq('project_id', project.id) as any);

                if (clips && clips.length > 0) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    resultData = {
                        clips: clips.map((c: any) => ({
                            id: c.id,
                            title: c.title,
                            url: c.video_url || '',
                            virality_score: c.virality_score || 0,
                            start_time: c.start_time,
                            end_time: c.end_time,
                            transcript_segment: c.transcript_segment,
                        })),
                        metadata: {
                            title: project.title,
                            duration: 0,
                            hooks_found: clips.length,
                        },
                    };
                }
            }
        }

        // Return job status with result_data
        return NextResponse.json({
            id: job.id,
            status: job.status,
            created_at: job.created_at,
            result_data: resultData,
            result_url: (job.result_data as { result_url?: string })?.result_url || null, // Legacy field
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
