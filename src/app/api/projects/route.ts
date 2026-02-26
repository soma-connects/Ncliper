import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { saveClipEmbedding } from '@/lib/video/embeddings';

export async function POST(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { title, url, clips } = body;

        // 1. Create the project
        const { data: projectRaw, error } = await supabase
            .from('projects')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .insert({
                title,
                video_url: url,
                user_id: userId,
                status: 'completed' // Project is done since we use pre-generated clips
            } as any)
            .select()
            .single();

        const project = (projectRaw as unknown) as { id: string };

        if (error) throw error;

        // 2. If clips are provided, insert them and generate embeddings
        if (clips && Array.isArray(clips) && clips.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const clipsToInsert = clips.map((clip: any) => ({
                project_id: project.id,
                title: clip.title,
                start_time: clip.startTime || clip.start_time || 0,
                end_time: clip.endTime || clip.end_time || 0,
                virality_score: clip.score || clip.virality_score || 0,
                video_url: clip.url || '',
                transcript_segment: clip.segments || clip.transcript_segment || null
            }));

            const { data: insertedClips, error: insertError } = await supabase
                .from('clips')
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .insert(clipsToInsert as any)
                .select();

            if (insertError) {
                console.error("Failed to insert clips:", insertError);
            } else if (insertedClips && insertedClips.length > 0) {
                console.log(`[API] Saved ${insertedClips.length} clips. Generating semantic embeddings...`);
                // Generate embeddings asynchronously (fire and forget)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                Promise.all(insertedClips.map((clip: any) => {
                    // Extract text context for vector embedding
                    const text = clip.transcript_segment
                        ? JSON.stringify(clip.transcript_segment)
                        : clip.title;
                    return saveClipEmbedding(clip.id, text);
                })).then(() => {
                    console.log(`[API] Finished generating embeddings for Project ${project.id}.`);
                }).catch(err => {
                    console.error("[API] Background embedding generation failed:", err);
                });
            }
        } else {
            // Fallback for backwards compatibility if a project is created without clips
            console.log("[API] No clips provided, starting async Modal worker fallback...");
            try {
                const { data: jobRaw, error: jobError } = await supabase
                    .from('jobs')
                    .insert({
                        user_id: userId,
                        video_url: url,
                        status: 'queued',
                        settings: { project_id: project.id }
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } as any)
                    .select()
                    .single();

                const job = (jobRaw as unknown) as { id: string };

                if (!jobError && job) {
                    const { invokeModalWorker } = await import('@/lib/worker/modal');
                    invokeModalWorker({
                        job_id: job.id,
                        project_id: project.id,
                        video_url: url,
                        settings: { clip_count: 3 }
                    }).catch(err => console.error("Worker invocation failed:", err));
                }
            } catch (jobErr) {
                console.error("Failed to start background job:", jobErr);
            }
        }

        return NextResponse.json(project);
    } catch (error) {
        console.error('Error creating project:', error);
        return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
    }
}

export async function GET(_request: Request) {
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
