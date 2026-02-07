'use server';
import 'server-only';

import YTDlpWrap from 'youtube-dl-exec';
import { analyzeTranscript } from './virality';
import { createViralClip, extractFrame } from './processor';
import { generateCaptionChunks } from './captions';
import { generateClipMetadata } from './metadata';
import { generateImage } from './image-gen';
import { supabaseAdmin } from '@/lib/supabase/server';
import { Database } from '@/lib/supabase/types';
import { SupabaseClient } from '@supabase/supabase-js';

const supabase = supabaseAdmin as SupabaseClient<Database>;

// Helper types
type ClipInsert = Database['public']['Tables']['clips']['Insert'];
type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

// Helper to fetch and parse transcripts
async function fetchTranscript(url: string, ytDlpPath: string): Promise<string> {
    const yt = YTDlpWrap.create(ytDlpPath);
    console.log("[VideoFetcher] Fetching metadata for transcript...");

    // 1. Get Metadata to find subtitle URL
    const output = await yt(url, {
        dumpSingleJson: true,
        noWarnings: true,
        writeAutoSub: true,
        subLang: 'en',
    }) as any;

    // 2. Find best subtitle URL (Manual > Auto)
    let subUrl = null;
    const langs = ['en', 'en-US', 'en-GB']; // Prioritize English

    if (output.subtitles) {
        for (const lang of langs) {
            if (output.subtitles[lang]) {
                const format = output.subtitles[lang].find((s: any) => s.ext === 'json3');
                if (format) {
                    subUrl = format.url;
                    break;
                }
            }
        }
    }

    if (!subUrl && output.automatic_captions) {
        for (const lang of langs) {
            if (output.automatic_captions[lang]) {
                const format = output.automatic_captions[lang].find((s: any) => s.ext === 'json3');
                if (format) {
                    subUrl = format.url;
                    break;
                }
            }
        }
    }

    if (!subUrl) {
        // Fallback: Use description if no subs found
        console.warn("[VideoFetcher] No subtitles found, falling back to description.");
        return output.description || "No transcript available.";
    }

    // 3. Fetch the JSON3 content
    console.log(`[VideoFetcher] Downloading subtitles from: ${subUrl}`);
    const subResponse = await fetch(subUrl);
    if (!subResponse.ok) {
        throw new Error("Failed to download subtitle content");
    }
    const subJson = await subResponse.json();

    // 4. Parse JSON3 to plain text
    // JSON3 format: { events: [ { tStartMs, dDurationMs, segs: [ { utf8: "text" } ] } ] }
    let fullText = "";
    if (subJson.events) {
        fullText = subJson.events
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((e: any) => e.segs ? e.segs.map((s: any) => s.utf8).join('') : '')
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    return fullText || output.description || "No transcript available.";
}

export async function getVideoTitle(url: string, ytDlpPathArg?: string): Promise<{ title?: string; error?: string }> {
    try {
        if (!url) {
            return { error: "URL is required" };
        }

        const path = await import('path');
        const ytDlpPath = ytDlpPathArg || path.join(process.cwd(), 'node_modules', 'youtube-dl-exec', 'bin', 'yt-dlp.exe');

        console.log(`[VideoFetcher] Using yt-dlp path: ${ytDlpPath}`);

        const yt = YTDlpWrap.create(ytDlpPath);

        // Using youtube-dl-exec to fetch metadata
        const output = await yt(url, {
            dumpSingleJson: true,
            noWarnings: true,
            preferFreeFormats: true,
        }) as any;

        return { title: output.title };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error("Error fetching video title:", error);
        if (error.stderr) {
            console.error("yt-dlp stderr:", error.stderr);
        }
        return { error: error.message || "Failed to fetch video title" };
    }
}

// Helper to format duration
function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export async function getViralHooks(url: string) {
    try {
        if (!url) {
            return { error: "URL is required" };
        }

        const path = await import('path');
        const ytDlpPath = path.join(process.cwd(), 'node_modules', 'youtube-dl-exec', 'bin', 'yt-dlp.exe');

        // Extract video ID from URL
        let videoId = "";
        if (url.includes('v=')) {
            videoId = url.split('v=')[1]?.split('&')[0];
        } else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1]?.split('?')[0];
        }

        // 1. Fetch Real Transcript
        let transcript = "";
        try {
            transcript = await fetchTranscript(url, ytDlpPath);
        } catch (err) {
            console.error("Transcript fetch failed, using fallback:", err);
            transcript = "Failed to fetch transcript. Analyzing video metadata only.";
        }

        console.log(`[VideoFetcher] Transcript length: ${transcript.length}`);

        // 2. Analyze with Gemini
        const hooksJson = await analyzeTranscript(transcript);

        // Ensure we parse it if it returns a string (Gemini SDK returns string usually, but we want object)
        const cleanedJson = hooksJson.replace(/```json/g, '').replace(/```/g, '').trim();
        const hooks = JSON.parse(cleanedJson);

        // 3. Map to Clip objects
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const clips = await Promise.all(hooks.map(async (hook: any, index: number) => {
            // Fetch captions for this specific segment to populate the editor
            const transcriptSegments = await fetchCaptions(url, ytDlpPath, hook.start_time, hook.end_time);

            // Map raw captions to TranscriptSegment
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const formattedTranscript = transcriptSegments.map((s: any) => ({
                timestamp: formatDuration(s.start),
                text: s.text
            }));

            return {
                id: index + 1,
                title: hook.type || `Viral Clip ${index + 1}`,
                score: hook.virality_score,
                duration: formatDuration(hook.end_time - hook.start_time),
                url: url, // Original URL for now, or YouTube embed URL
                videoId: videoId,
                thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`, // Use YouTube thumbnail
                startTime: hook.start_time,
                endTime: hook.end_time,
                segments: hook.segments,
                transcript: formattedTranscript
            };
        }));

        return { clips };

    } catch (error: any) {
        console.error("Error analyzing viral hooks:", error);
        return { error: error.message || "Failed to analyze video" };
    }
}

// Helper to fetch valid caption chunks with timestamps
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchCaptions(url: string, ytDlpPath: string, startTime: number, endTime: number): Promise<any[]> {
    const yt = YTDlpWrap.create(ytDlpPath);

    // 1. Get Metadata to find subtitle URL (Similar to fetchTranscript but focused on returning objects)
    const output = await yt(url, {
        dumpSingleJson: true,
        noWarnings: true,
        writeAutoSub: true,
        subLang: 'en',
    }) as any;

    let subUrl = null;
    const langs = ['en', 'en-US', 'en-GB'];

    if (output.subtitles) {
        for (const lang of langs) {
            if (output.subtitles[lang]) {
                const format = output.subtitles[lang].find((s: any) => s.ext === 'json3');
                if (format) { subUrl = format.url; break; }
            }
        }
    }

    if (!subUrl && output.automatic_captions) {
        for (const lang of langs) {
            if (output.automatic_captions[lang]) {
                const format = output.automatic_captions[lang].find((s: any) => s.ext === 'json3');
                if (format) { subUrl = format.url; break; }
            }
        }
    }

    if (!subUrl) return [];

    const subResponse = await fetch(subUrl);
    if (!subResponse.ok) return [];
    const subJson = await subResponse.json();

    const rawWords: { text: string; start: number }[] = [];
    if (subJson.events) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        subJson.events.forEach((e: any) => {
            if (e.segs) {
                const segmentStart = e.tStartMs;
                let currentOffset = 0;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                e.segs.forEach((s: any) => {
                    const wordText = s.utf8;
                    if (!wordText || wordText.trim() === '') return;

                    let startMs = segmentStart;
                    if (s.tOffsetMs) {
                        startMs += s.tOffsetMs;
                    } else {
                        // Fallback offset
                        startMs += currentOffset;
                        currentOffset += 500;
                    }

                    rawWords.push({
                        text: wordText.trim(),
                        start: startMs / 1000
                    });
                });
            }
        });
    }

    // Sort words by time to ensure order
    rawWords.sort((a, b) => a.start - b.start);

    // Calculate durations based on next word
    const timedWords: any[] = [];
    for (let i = 0; i < rawWords.length; i++) {
        const word = rawWords[i];
        let end = word.start + 0.5; // Default 0.5s duration

        if (i < rawWords.length - 1) {
            const nextStart = rawWords[i + 1].start;
            // If next word starts properly after this one, use its start as end.
            // But don't let it be too long (max 2s silence gap)
            if (nextStart > word.start) {
                end = Math.min(nextStart, word.start + 2.0);
            }
        }

        // Filter by clip range
        if (word.start >= startTime && word.start < endTime) {
            timedWords.push({
                text: word.text,
                start: Number((word.start - startTime).toFixed(2)),
                end: Number((end - startTime).toFixed(2))
            });
        }
    }

    return timedWords;
}

export async function generateClip(url: string, segments: { start: number; end: number }[]) {
    try {
        if (!url) return { error: "URL is required" };
        if (!segments || segments.length === 0) return { error: "Segments are required" };

        const path = await import('path');
        const ytDlpPath = path.join(process.cwd(), 'node_modules', 'youtube-dl-exec', 'bin', 'yt-dlp.exe');

        let mergedCaptions: any[] = [];
        let currentOutputTime = 0;

        // Fetch and re-time captions for each segment
        for (const segment of segments) {
            const segDuration = segment.end - segment.start;
            let segCaptions: any[] = [];

            try {
                // fetchCaptions returns times relative to segment.start (starting at 0)
                segCaptions = await fetchCaptions(url, ytDlpPath, segment.start, segment.end);
            } catch (e) {
                console.warn(`Failed to fetch captions for segment ${segment.start}-${segment.end}`, e);
            }

            // Shift timestamps to match the concatenated timeline
            const shifted = segCaptions.map(c => ({
                text: c.text,
                start: Number((c.start + currentOutputTime).toFixed(2)),
                end: Number((c.end + currentOutputTime).toFixed(2))
            }));

            mergedCaptions.push(...shifted);
            currentOutputTime += segDuration;
        }

        const totalDuration = currentOutputTime;

        let captions: any[] = [];
        if (mergedCaptions.length > 0) {
            captions = generateCaptionChunks(mergedCaptions, totalDuration);
        }

        // Pass first segment to processor (concatenation support pending in processor.ts)
        const startTime = segments[0].start;
        const endTime = segments[0].end;

        const clipPath = await createViralClip(url, startTime, endTime, captions);
        return { path: clipPath };
    } catch (error: any) {
        console.error("Error generating clip:", error);
        return { error: "Failed to create viral clip. Ensure FFmpeg is installed." };
    }
}

// === New Thumbnail System Actions ===

export async function generateMetadataAction(transcript: string) {
    try {
        const metadataJson = await generateClipMetadata(transcript);
        const cleaned = metadataJson.replace(/```json/g, '').replace(/```/g, '').trim();
        return { metadata: JSON.parse(cleaned) };
    } catch (e: any) {
        console.error("Metadata Action Error:", e);
        return { error: "Failed to generate metadata" };
    }
}

export async function generateThumbnailFrameAction(videoUrl: string, timestamp: number) {
    try {
        const path = await extractFrame(videoUrl, timestamp);
        return { path };
    } catch (e: any) {
        console.error("Frame Extractor Error:", e);
        return { error: "Failed to extract frame" };
    }
}

export async function generateAIThumbnailAction(prompt: string) {
    try {
        const result = await generateImage(prompt);
        if (!result) return { error: "Image generation failed or returned empty" };

        // Return result assuming it's usable or placeholder if logic incomplete
        // For MVP we might need to verify what 'result' is in browser console
        return { result };
    } catch (e: any) {
        console.error("AI Thumbnail Error:", e);
        return { error: "Failed to generate AI thumbnail" };
    }
}

export async function processVideoForProject(projectId: string, videoUrl: string) {
    try {
        console.log(`[Action] Processing video for project ${projectId}...`);

        // 1. Update status to processing
        const processingUpdate: Database['public']['Tables']['projects']['Update'] = { status: 'processing' };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('projects') as any).update(processingUpdate).eq('id', projectId);

        // 2. Analyze video
        // getViralHooks now returns { clips } or { error }
        const { clips, error } = await getViralHooks(videoUrl);

        if (error || !clips) {
            console.error("Analysis failed:", error);
            const failedUpdate: ProjectUpdate = { status: 'failed' };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase.from('projects') as any).update(failedUpdate).eq('id', projectId);
            return { error: error || "Analysis failed" };
        }

        // 3. Save Clips
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const clipsToInsert: ClipInsert[] = clips.map((clip: any) => ({
            project_id: projectId,
            title: clip.title,
            start_time: clip.startTime,
            end_time: clip.endTime,
            virality_score: clip.score,
            transcript_segment: clip.transcript as unknown as Database['public']['Tables']['clips']['Insert']['transcript_segment'], // Explicit cast for Json compatibility
            video_url: '', // Will be filled when clip is generated
        }));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: insertError } = await (supabase.from('clips') as any).insert(clipsToInsert);
        if (insertError) throw insertError;

        // 4. Update status to completed
        const completedUpdate: ProjectUpdate = { status: 'completed' };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('projects') as any).update(completedUpdate).eq('id', projectId);

        return { success: true, count: clipsToInsert.length };

    } catch (e: any) {
        console.error("Process Video Error:", e);
        const failedUpdate: ProjectUpdate = { status: 'failed' };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('projects') as any).update(failedUpdate).eq('id', projectId);
        return { error: e.message };
    }
}

export async function getProjectClips(projectId: string) {
    try {
        // 1. Get Project URL (Main Video)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: project } = await (supabase.from('projects') as any)
            .select('video_url')
            .eq('id', projectId)
            .single();

        const projectVideoUrl = project?.video_url || '';

        // 2. Get Clips
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.from('clips') as any)
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Map database columns to Clip type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return data.map((c: any) => {
            // Use generated clip URL if exists, else fallback to main video URL
            const finalUrl = c.video_url || projectVideoUrl;
            const videoId = extractVideoId(finalUrl);

            return {
                id: c.id,
                title: c.title,
                score: c.virality_score || 0,
                duration: formatDuration((c.end_time || 0) - (c.start_time || 0)),
                url: finalUrl,
                videoId: videoId,
                thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                startTime: c.start_time,
                endTime: c.end_time,
                segments: c.transcript_segment ? (Array.isArray(c.transcript_segment) ? c.transcript_segment : []) : [],
                transcript: []
            };
        });
    } catch (e) {
        console.error("Fetch Clips Error:", e);
        return [];
    }
}

function extractVideoId(url: string) {
    if (url.includes('v=')) return url.split('v=')[1]?.split('&')[0];
    if (url.includes('youtu.be/')) return url.split('youtu.be/')[1]?.split('?')[0];
    return '';
}

export async function generateMoreClipsAction(videoUrl: string, projectId: string) {
    // Re-run the analysis (random seed in virality.ts ensures variety)
    // We reuse processVideoForProject which handles DB updates too
    console.log("[Action] Generating MORE clips for project:", projectId);
    const result = await processVideoForProject(projectId, videoUrl);
    return result;
}
