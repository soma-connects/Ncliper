export interface TranscriptSegment {
    timestamp: string; // e.g. "00:04"
    text: string;
}

export interface Clip {
    id: number | string;
    title: string;
    score: number;
    duration: string;
    url: string; // YouTube URL or direct link if generated
    videoId: string; // YouTube Video ID
    thumbnailUrl: string;
    startTime: number;
    endTime: number;
    segments: { start: number; end: number }[];
    transcript: TranscriptSegment[];
}
