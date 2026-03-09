import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: rawData, error } = await supabase
            .from('clips')
            .select('*')
            .eq('project_id', params.id)
            .order('start_time', { ascending: true }); // Ordering by time usually makes sense

        if (error) throw error;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = rawData as any[];

        // Fetch the parent project to get the original YouTube URL
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: project } = await (supabase.from('projects') as any)
            .select('video_url')
            .eq('id', params.id)
            .single();

        const projectVideoUrl = project?.video_url || '';

        // Helper to extract video ID
        const extractVideoId = (url: string) => {
            if (url.includes('v=')) return url.split('v=')[1]?.split('&')[0];
            if (url.includes('youtu.be/')) return url.split('youtu.be/')[1]?.split('?')[0];
            return '';
        };

        const sourceVideoId = extractVideoId(projectVideoUrl);
        const fallbackThumbnail = "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80";

        // Transform if needed to match frontend Clip interface
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedClips = data.map((clip: any) => ({
            id: clip.id,
            title: clip.title,
            score: clip.virality_score || 0,
            duration: `${Math.floor((clip.end_time - clip.start_time))}s`,
            url: clip.video_url,
            videoId: sourceVideoId,
            thumbnailUrl: sourceVideoId ? `https://img.youtube.com/vi/${sourceVideoId}/maxresdefault.jpg` : fallbackThumbnail,
            startTime: clip.start_time,
            endTime: clip.end_time,
            segments: clip.transcript_segment ? (Array.isArray(clip.transcript_segment) ? clip.transcript_segment : [{ start: clip.start_time, end: clip.end_time }]) : [],
            transcript: []
        }));

        return NextResponse.json(formattedClips);
    } catch (error) {
        console.error('Error fetching clips:', error);
        return NextResponse.json({ error: 'Failed to fetch clips' }, { status: 500 });
    }
}
