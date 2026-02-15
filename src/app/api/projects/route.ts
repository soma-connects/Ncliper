import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { title, url } = body;

        const { data: project, error } = await supabase
            .from('projects')
            .insert({
                title,
                video_url: url,
                user_id: userId,
                status: 'processing' // Start as processing immediately
            } as any)
            .select()
            .single();

        if (error) throw error;

        // --- Start Async Job ---
        try {
            // 1. Create Job Record
            const { data: job, error: jobError } = await supabase
                .from('jobs')
                .insert({
                    user_id: userId,
                    video_url: url,
                    status: 'queued',
                    settings: { project_id: (project as any).id } // Store project_id in settings since column might not exist
                } as any)
                .select()
                .single();

            if (!jobError && job) {
                // 2. Invoke Worker
                const { invokeModalWorker } = await import('@/lib/worker/modal');
                // Fire and forget
                invokeModalWorker({
                    job_id: (job as any).id,
                    project_id: (project as any).id,
                    video_url: url,
                    settings: { clip_count: 3 }
                }).catch(err => console.error("Worker invocation failed:", err));
            }
        } catch (jobErr) {
            console.error("Failed to start background job:", jobErr);
            // Don't fail the project creation, just log it. User can retry?
        }
        // -----------------------

        return NextResponse.json(project);
    } catch (error) {
        console.error('Error creating project:', error);
        return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching projects:', error);
        return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }
}
