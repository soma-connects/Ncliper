'use client';


import { Play, Pause, SkipBack, SkipForward, Maximize2, Volume2 } from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Clip } from '@/lib/video/types';

interface VideoPlayerProps {
    clip?: Clip | null;
}

export function VideoPlayer({ clip }: VideoPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    const isYouTube = clip?.url?.includes('youtube.com') || clip?.url?.includes('youtu.be');

    // YouTube Embed: Use simpler integers but try to respect bounds
    // Note: YouTube 'end' param stops playback. It does not loop automatically.
    // For MVP, stopping at end is better than playing next video.
    const embedUrl = useMemo(() => {
        if (!isYouTube || !clip?.videoId) return null;
        return `https://www.youtube.com/embed/${clip.videoId}?start=${Math.floor(clip.startTime)}&end=${Math.ceil(clip.endTime)}&autoplay=${isPlaying ? 1 : 0}&rel=0&modestbranding=1&controls=0&cc_load_policy=0`;
    }, [isYouTube, clip, isPlaying]);

    // Reset playing state when clip changes
    useEffect(() => {
        if (clip) {
            setIsPlaying(true);
            setProgress(0);
            setCurrentTime(clip.startTime);
            // If local video, seek to start
            if (videoRef.current) {
                videoRef.current.currentTime = clip.startTime;
                videoRef.current.play().catch(() => setIsPlaying(false));
            }
        } else {
            setIsPlaying(false);
        }
    }, [clip]);

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
        if (isYouTube) {
            // Iframe toggle handled by re-render/autoplay param mainly
            // or we accept it's just an overlay toggle
        } else if (videoRef.current) {
            if (isPlaying) videoRef.current.pause();
            else videoRef.current.play();
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current && clip) {
            const current = videoRef.current.currentTime;
            setCurrentTime(current);

            // Manual Loop Logic for Local Video
            if (current >= clip.endTime) {
                videoRef.current.currentTime = clip.startTime;
                videoRef.current.play();
                return;
            }

            // Relative Progress Calculation
            const clipDuration = clip.endTime - clip.startTime;
            const relativeTime = current - clip.startTime;
            const pct = Math.max(0, Math.min(100, (relativeTime / clipDuration) * 100));
            setProgress(pct);
        }
    };

    // Find active caption
    const activeCaption = useMemo(() => {
        if (!clip?.transcript) return null;
        // Adjust for relative time if transcript timestamps are relative to clip start
        // Actually, Virality engine returns segments with relative to 0 of the *clip* usually? 
        // Let's check actions.ts: "start: Number((c.start + currentOutputTime).toFixed(2))" essentially relative to generated clip?
        // Wait, for *previewing* raw source video, the transcript segments should match the source timestamps (startTime + offset).
        // Let's look at actions.ts: "formattedTranscript" in getViralHooks maps s.start directly from fetchCaptions?
        // fetchCaptions returns "start: word.start - startTime".
        // So `clip.transcript` has timestamps RELATIVE TO CLIP START (0...duration).

        // If playing Local Source Video (raw url), current is Absolute Time (e.g. 120s).
        // Clip starts at 120s. Transcript says "0.5s".
        // So we need to match: (currentTime - clip.startTime) vs (caption.timestamp string converted to sec?)
        // Wait, `clip.transcript` is { timestamp: "MM:SS", text: "..." }. This is purely display?
        // Let's check `Clip` type definition to see if we have raw segments.
        // `segments` field has raw data? "segments: hook.segments" (which are absolute ranges).
        // But we need individual words/sentences for captioning.

        // RE-READ actions.ts getViralHooks:
        // formattedTranscript = transcriptSegments.map(s => ({ timestamp: formatDuration(s.start), text: s.text }))
        // transcriptSegments comes from fetchCaptions which shifts start by `- startTime`.
        // So formattedTranscript is RELATIVE to clip start.

        // Display logic:
        // currentRelTime = currentTime - clip.startTime.
        // We need to parse "MM:SS" back to seconds to compare? efficient.
        // Better to use `rawTranscript` if we had it, but we only have `transcript` prop which is text based?
        // Actually `segments` prop on Clip might be useful? No, that's just the cut list.

        // Let's parse the timestamp from formattedTranscript
        const relTime = currentTime - (clip?.startTime || 0);

        return clip?.transcript?.find(t => {
            const [m, s] = t.timestamp.split(':').map(Number);
            const timeStart = m * 60 + s;
            // Assumption: Each segment lasts until next one? or arbitrary duration?
            // fetchCaptions uses 2-3 word chunks.
            // Let's assume a 2 second window or find the one strictly current.
            // Since we don't have 'end' in formattedTranscript, detailed captioning is hard.
            // BUT: `transcript_segment` in DB has json?

            // Allow 1.5s window for now as fallback
            return relTime >= timeStart && relTime < timeStart + 2;
        });
    }, [currentTime, clip]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="relative w-full h-full max-w-[360px] aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-card mx-auto group">
            <AnimatePresence mode="wait">
                {clip ? (
                    <motion.div
                        key={clip.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-full relative"
                    >
                        {isYouTube && embedUrl ? (
                            <div className="w-full h-full pointer-events-auto">
                                <iframe
                                    ref={iframeRef}
                                    src={embedUrl}
                                    title={clip.title}
                                    className="w-full h-full object-cover"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                        ) : (
                            <video
                                ref={videoRef}
                                className="w-full h-full object-cover"
                                src={clip.url}
                                playsInline
                                // No 'loop' attribute on the tag itself, we handle it manually
                                autoPlay
                                onTimeUpdate={handleTimeUpdate}
                                onClick={togglePlay}
                            />
                        )}
                    </motion.div>
                ) : (
                    /* Removed static placeholder */
                    null
                )}
            </AnimatePresence>

            {/* Dynamic Caption Overlay */}
            {clip && !isYouTube && activeCaption && (
                <div className="absolute bottom-24 left-4 right-4 text-center pointer-events-none z-10 flex flex-col items-center justify-end h-32">
                    <motion.div
                        key={activeCaption.timestamp} // Animate change
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="bg-black/60 backdrop-blur-sm text-yellow-400 px-3 py-1.5 rounded-lg text-lg font-bold shadow-lg border border-yellow-400/20"
                    >
                        {activeCaption.text}
                    </motion.div>
                </div>
            )}

            {/* Custom Controls - Modified for better UX */}
            {!isYouTube && (
                <div className={cn(
                    "absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-12 transition-opacity duration-300 z-20",
                    !clip ? "opacity-0 pointer-events-none" : "opacity-100"
                )}>
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-mono text-white/80">
                            {/* Show relative time */}
                            {clip ? formatTime(Math.max(0, currentTime - clip.startTime)) : "00:00"}
                            /
                            {clip ? clip.duration : "00:00"}
                        </span>
                        <Maximize2 className="w-4 h-4 text-white/80 hover:text-white cursor-pointer" />
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-white/20 rounded-full mb-6 cursor-pointer group/progress">
                        <div
                            className="h-full bg-primary relative group-hover/progress:bg-primary/80 transition-colors rounded-full"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover/progress:opacity-100 transition-opacity scale-150" />
                        </div>
                    </div>

                    {/* Main Controls */}
                    <div className="flex items-center justify-between px-4">
                        <Volume2 className="w-5 h-5 text-white/50 hover:text-white cursor-pointer" />
                        <div className="flex items-center gap-6">
                            <SkipBack className="w-6 h-6 text-white hover:text-primary transition-colors cursor-pointer active:scale-90" />
                            <button
                                onClick={togglePlay}
                                className="w-14 h-14 rounded-full bg-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-white/10"
                            >
                                {isPlaying ? (
                                    <Pause className="w-6 h-6 text-black fill-current" />
                                ) : (
                                    <Play className="w-6 h-6 text-black fill-current ml-1" />
                                )}
                            </button>
                            <SkipForward className="w-6 h-6 text-white hover:text-primary transition-colors cursor-pointer active:scale-90" />
                        </div>
                        <div className="w-5" />
                    </div>
                </div>
            )}
        </div>
    );
}
