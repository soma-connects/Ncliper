import 'server-only';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import YTDlpWrap from 'youtube-dl-exec';

// Ensure the clips directory exists
const CLIPS_DIR = path.join(process.cwd(), 'public', 'clips');
if (!fs.existsSync(CLIPS_DIR)) {
    fs.mkdirSync(CLIPS_DIR, { recursive: true });
}

import { CaptionChunk } from './captions';

// Helper to determine font path based on OS (simple fallback)
const getFontPath = () => {
    // User requested specific local font
    const localFontPath = path.join(process.cwd(), 'src', 'assets', 'fonts', 'Roboto-Bold.ttf');
    if (fs.existsSync(localFontPath)) {
        return localFontPath;
    }

    // Fallback if local download failed
    const winPath = 'C:\\Windows\\Fonts\\arial.ttf';
    if (fs.existsSync(winPath)) return winPath;

    return 'Arial';
};

// Helper to get stream URL
const getVideoStreamUrl = async (videoUrl: string): Promise<string> => {
    const ytDlpPath = path.join(process.cwd(), 'node_modules', 'youtube-dl-exec', 'bin', 'yt-dlp.exe');
    const yt = YTDlpWrap.create(ytDlpPath);

    const streamUrlOutput = await yt(videoUrl, {
        getUrl: true,
        format: '22/18', // Force 720p or similar
        noWarnings: true,
    }) as any;
    
    return (typeof streamUrlOutput === 'string' ? streamUrlOutput : streamUrlOutput.toString()).trim();
};

export const extractFrame = async (videoUrl: string, timestamp: number): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        try {
            const localFfmpeg = path.join(process.cwd(), 'ffmpeg.exe');
            if (fs.existsSync(localFfmpeg)) {
                ffmpeg.setFfmpegPath(localFfmpeg);
            }

            const streamUrl = await getVideoStreamUrl(videoUrl);
            if (!streamUrl) throw new Error('Failed to get video stream');

            const fileName = `thumb_${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`;
            const thumbnailsDir = path.join(process.cwd(), 'public', 'thumbnails');
            if (!fs.existsSync(thumbnailsDir)) {
                fs.mkdirSync(thumbnailsDir, { recursive: true });
            }
            const outputPath = path.join(thumbnailsDir, fileName);

            ffmpeg(streamUrl)
                .seekInput(timestamp)
                .frames(1)
                .output(outputPath)
                .on('end', () => resolve(`/thumbnails/${fileName}`))
                .on('error', (e) => reject(e))
                .run();

        } catch (error) {
            console.error('Extract Frame Error:', error);
            reject(error);
        }
    });
};

export const createViralClip = async (videoUrl: string, startTime: number, endTime: number, captions: CaptionChunk[] = []): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        try {
            // 1. Configure FFmpeg Path
            const localFfmpeg = path.join(process.cwd(), 'ffmpeg.exe');
            if (fs.existsSync(localFfmpeg)) {
                ffmpeg.setFfmpegPath(localFfmpeg);
            }

            // 2. Get Direct Stream URL using yt-dlp
            const streamUrl = await getVideoStreamUrl(videoUrl);

            if (!streamUrl) {
                return reject(new Error('Failed to retrieve video stream URL'));
            }

            const duration = endTime - startTime;
            const clipId = `clip_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            const fileName = `${clipId}.mp4`;
            const outputPath = path.join(CLIPS_DIR, fileName);

            // Prepare Complex Filters
            // Goal: Blur Fill (Original video centered, blurred background filling 9:16 frame)

            const complexFilters: string[] = [];

            // 1. Split the input into two streams: [bg] and [fg]
            complexFilters.push('[0:v]split=2[bg][fg]');

            // 2. Background Chain: Scale to cover 9:16 area (assuming vertical output)
            // We scale height to 1280 (common HD height), width auto.
            // Then crop to 720:1280 (9:16).
            complexFilters.push('[bg]scale=-1:1280,crop=720:1280:(iw-720)/2:0,boxblur=20:10[bg_blurred]');

            // 3. Foreground Chain: Scale to fit 720 width (preserving aspect)
            // scale=720:-1 force width to 720, height auto
            complexFilters.push('[fg]scale=720:-1[fg_scaled]');

            // 4. Overlay [fg] onto [bg] at center
            complexFilters.push('[bg_blurred][fg_scaled]overlay=(W-w)/2:(H-h)/2[out_v]');

            // 5. Add Captions to [out_v]
            // We accumulate texts onto the [out_v] label (or chain them).
            let lastLabel = '[out_v]';

            if (captions && captions.length > 0) {
                // ROBUST WINDOWS FONT FIX:
                const originalFontPath = getFontPath();
                const tempFontName = 'temp_font.ttf';
                const tempFontPath = path.join(process.cwd(), tempFontName);

                try {
                    if (!fs.existsSync(tempFontPath)) {
                        fs.copyFileSync(originalFontPath, tempFontPath);
                    }
                } catch (e) {
                    console.warn("Failed to copy font, captions might fail:", e);
                }
                const fontPath = tempFontName;

                captions.forEach((chunk, index) => {
                    const safeText = chunk.text.replace(/'/g, '');
                    const nextLabel = `[txt${index}]`;

                    const drawText = `drawtext=text='${safeText}':enable='between(t,${chunk.start},${chunk.end})':` +
                        `fontfile='${fontPath}':fontsize=30:fontcolor=white:borderw=2:bordercolor=black:` +
                        `x=(w-text_w)/2:y=h-(h/5)`; // Slightly higher up

                    // Chain it: [lastLabel]drawtext...[nextLabel]
                    complexFilters.push(`${lastLabel}${drawText}${nextLabel}`);
                    lastLabel = nextLabel;
                });
            }

            // 2. FFmpeg Processing
            ffmpeg(streamUrl)
                .setStartTime(startTime)
                .setDuration(duration)
                .complexFilter(complexFilters, lastLabel)
                .outputOptions(['-map 0:a']) // Explicitly map audio from input 0
                .output(outputPath)
                .on('progress', (progress) => {
                    // Log progress server-side. 
                    if (progress.percent) {
                        console.log(`Processing: ${Math.round(progress.percent)}% done`);
                    }
                })
                .on('end', () => {
                    resolve(`/clips/${fileName}`);
                })
                .on('error', (err) => {
                    console.error('FFmpeg processing error:', err);
                    reject(err);
                })
                .run();

        } catch (error) {
            console.error('Error in createViralClip:', error);
            reject(error);
        }
    });
};
