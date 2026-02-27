import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { Database } from '@/lib/supabase/types';
import { SupabaseClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const supabase = supabaseAdmin as SupabaseClient<Database>;

const API_KEY = process.env.GOOGLE_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

// Schema for structured Gemini response
const matchSchema = {
    type: SchemaType.ARRAY,
    description: "List of matching moments found in the transcript",
    items: {
        type: SchemaType.OBJECT,
        properties: {
            start_time: {
                type: SchemaType.NUMBER,
                description: "Start time in seconds where the topic begins",
                nullable: false,
            },
            end_time: {
                type: SchemaType.NUMBER,
                description: "End time in seconds where the topic ends",
                nullable: false,
            },
            snippet: {
                type: SchemaType.STRING,
                description: "A short 1-2 sentence excerpt of what is said at this timestamp",
                nullable: false,
            },
            confidence: {
                type: SchemaType.NUMBER,
                description: "Confidence score 0-100 that this matches the user's query",
                nullable: false,
            },
        },
        required: ["start_time", "end_time", "snippet", "confidence"],
    },
};

/**
 * POST /api/prompt-to-clip
 * Uses Gemini to find exact timestamps in a video transcript matching a user's natural language query.
 *
 * Body:
 * {
 *   project_id?: string;  // If searching within an existing project
 *   transcript?: string;  // Or pass transcript directly
 *   query: string;        // "Find where they talk about GTA 6"
 * }
 */
import { z } from 'zod';

const promptRequestSchema = z.object({
    project_id: z.string().uuid().optional(),
    transcript: z.string().optional(),
    query: z.string().min(1, "Search query is required"),
});

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let rawBody;
        try {
            rawBody = await req.json();
        } catch {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        const parseResult = promptRequestSchema.safeParse(rawBody);

        if (!parseResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: parseResult.error.format() },
                { status: 400 }
            );
        }

        const { project_id, transcript: directTranscript, query } = parseResult.data;

        // 1. Get transcript — either from the project or passed directly
        let transcript = directTranscript;

        if (!transcript && project_id) {
            // Fetch clips for this project and combine their transcripts
            const { data: clips, error: clipError } = await supabase
                .from('clips')
                .select('transcript_segment, start_time, end_time')
                .eq('project_id', project_id);

            if (clipError || !clips || clips.length === 0) {
                return NextResponse.json({ error: 'No transcript found for this project' }, { status: 404 });
            }

            // Combine all transcript segments into one string with timestamps
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            transcript = clips.map((clip: any) => {
                if (clip.transcript_segment) {
                    if (typeof clip.transcript_segment === 'string') return clip.transcript_segment;
                    if (Array.isArray(clip.transcript_segment)) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        return clip.transcript_segment.map((s: any) => `[${s.start || clip.start_time}s] ${s.text || s.utf8 || ''}`).join('\n');
                    }
                }
                return '';
            }).filter(Boolean).join('\n');
        }

        if (!transcript || transcript.trim() === '') {
            return NextResponse.json({ error: 'No transcript available to search' }, { status: 400 });
        }

        // 2. Send to Gemini with a focused "find timestamps" prompt
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            generationConfig: {
                responseMimeType: 'application/json',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                responseSchema: matchSchema as any,
                temperature: 0.2, // Low creativity for precision
            },
        });

        const prompt = `You are a video transcript search engine. A user wants to find specific moments in a video.

USER QUERY: "${query}"

TRANSCRIPT:
${transcript.substring(0, 50000)}

INSTRUCTIONS:
1. Find ALL moments in the transcript where the speaker discusses the topic "${query}".
2. For each match, return the exact start_time and end_time in seconds.
3. Include a short 1-2 sentence snippet of what is said.
4. Rate your confidence (0-100) that this segment truly matches the user's intent.
5. Be generous with the time range — include a few seconds of context before and after.
6. If no matches are found, return an empty array [].
7. Return at most 5 matches, ordered by confidence (highest first).`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        let matches = [];
        try {
            matches = JSON.parse(responseText);
        } catch {
            console.error('[PromptToClip] Failed to parse Gemini response:', responseText);
            return NextResponse.json({ error: 'AI returned invalid response' }, { status: 500 });
        }

        return NextResponse.json({ matches });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('[PromptToClip] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
