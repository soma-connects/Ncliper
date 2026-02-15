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

        // Transform if needed to match frontend Clip interface
        const formattedClips = data.map(clip => ({
            id: clip.id,
            title: clip.title,
            score: clip.virality_score || 0,
            duration: `${Math.floor((clip.end_time - clip.start_time))}s`,
            url: clip.video_url,
            videoId: clip.video_url.split('/').pop()?.split('.')[0] || 'generated', // Fallback ID
            thumbnailUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80",
            startTime: clip.start_time,
            endTime: clip.end_time,
            segments: [{ start: clip.start_time, end: clip.end_time }],
            transcript: clip.transcript_segment || []
        }));

        return NextResponse.json(formattedClips);
    } catch (error) {
        console.error('Error fetching clips:', error);
        return NextResponse.json({ error: 'Failed to fetch clips' }, { status: 500 });
    }
}
