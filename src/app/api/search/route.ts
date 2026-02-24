import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { searchSemanticClips } from '@/lib/video/embeddings';

/**
 * POST /api/search
 * Perform a semantic search across the user's video clips.
 * 
 * Body:
 * {
 *   query: string; // The natural language search query (e.g., "Find the part about AI pricing")
 *   limit?: number; // Optional limit
 *   threshold?: number; // Optional similarity threshold (0.0 to 1.0)
 * }
 */
export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { query, limit = 10, threshold = 0.5 } = body;

        if (!query || typeof query !== 'string') {
            return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
        }

        const result = await searchSemanticClips(query, userId, threshold, limit);

        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ clips: result.clips });

    } catch (error) {
        console.error('[API Search] Search Handler Error:', error);
        return NextResponse.json({ error: 'Internal server error processing search' }, { status: 500 });
    }
}
