'use server';
import 'server-only';

import YTDlpWrap from 'youtube-dl-exec';
import { analyzeTranscript } from './virality';
import { createViralClip, extractFrame } from './processor';
import { generateCaptionChunks } from './captions';
import { generateClipMetadata } from './metadata';
import { generateImage } from './image-gen';

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

export async function getViralHooks(url: string) {
    try {
        if (!url) {
            return { error: "URL is required" };
        }

        const path = await import('path');
        const ytDlpPath = path.join(process.cwd(), 'node_modules', 'youtube-dl-exec', 'bin', 'yt-dlp.exe');

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
        // analyzeTranscript returns result.response.text().
        // We need to clean it to ensure JSON.
        const cleanedJson = hooksJson.replace(/```json/g, '').replace(/```/g, '').trim();
        const hooks = JSON.parse(cleanedJson);

        return { hooks, transcript }; // Return transcript as well

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
