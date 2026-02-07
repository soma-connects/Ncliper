import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // 1. Verify ownership
        const { data: project, error: fetchError } = await supabase
            .from('projects')
            .select('user_id')
            .eq('id', id)
            .single();

        if (fetchError || !project) {
            console.error('Error fetching project for deletion:', fetchError);
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        if (project.user_id !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // 2. Delete Project (Cascades to clips due to FK usually, but let's check or assume standard FK)
        const { error: deleteError } = await supabase
            .from('projects')
            .delete()
            .eq('id', id);

        if (deleteError) {
            console.error('Error deleting project:', deleteError);
            return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in DELETE project:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
