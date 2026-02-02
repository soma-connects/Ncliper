import 'server-only';

export interface CaptionChunk {
    text: string;
    start: number;
    end: number;
}

export interface TimedWord {
    text: string;
    start: number;
    end: number;
}

export function generateCaptionChunks(transcript: string | TimedWord[], totalDuration: number): CaptionChunk[] {
    // Case 1: Real Timed Words
    if (Array.isArray(transcript)) {
        const words = transcript;
        if (words.length === 0) return [];

        const chunks: CaptionChunk[] = [];
        const chunkSize = 2; // Words per chunk (Reduced for viral style)

        for (let i = 0; i < words.length; i += chunkSize) {
            const group = words.slice(i, i + chunkSize);
            if (group.length > 0) {
                const text = group.map(w => w.text).join(' ');
                const start = group[0].start;
                const end = group[group.length - 1].end;

                // Ensure no overlap or gap problems if needed, 
                // but basic start/end from words is best for sync
                chunks.push({
                    text,
                    start: Number(start.toFixed(2)),
                    end: Number(end.toFixed(2))
                });
            }
        }
        return chunks;
    }

    // Case 2: Fallback (Raw String) - distrubute evenly
    // Clean and split text into words
    const words = transcript.trim().split(/\s+/);

    if (words.length === 0) return [];

    // Group into chunks of 3 words
    const chunkSize = 3;
    const wordChunks: string[] = [];

    for (let i = 0; i < words.length; i += chunkSize) {
        wordChunks.push(words.slice(i, i + chunkSize).join(' '));
    }

    // Distribute time evenly across chunks (Mock logic)
    const timePerChunk = totalDuration / wordChunks.length;

    return wordChunks.map((text, index) => ({
        text,
        start: Number((index * timePerChunk).toFixed(2)),
        end: Number(((index + 1) * timePerChunk).toFixed(2))
    }));
}
