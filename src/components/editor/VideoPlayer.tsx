'use client';

import { Play, Pause, SkipBack, SkipForward, Maximize2, Volume2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
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

    const isYouTube = clip?.url?.includes('youtube.com') || clip?.url?.includes('youtu.be');

    // Construct YouTube Embed URL
    // Use rel=0 to avoid related videos, autoplay=1 for consistent behavior
    const embedUrl = isYouTube && clip?.videoId
        ? `https://www.youtube.com/embed/${clip.videoId}?start=${Math.floor(clip.startTime)}&end=${Math.floor(clip.endTime)}&autoplay=${isPlaying ? 1 : 0}&rel=0&modestbranding=1&controls=0`
        : null;

    // Reset playing state when clip changes
    useEffect(() => {
        if (clip) {
            setIsPlaying(true); // Auto-play on select
            setProgress(0);
        } else {
            setIsPlaying(false);
        }
    }, [clip]);

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
        if (isYouTube) {
            // For iframe, we depend on re-rendering with autoplay param or posting message
            // Re-rendering is simpler for generic embed, but postMessage is better for control.
            // For this MVF, simply toggling state refetches iframe or we use the overlay.
            // Actually, iframe reload is jarring. 
            // Ideally use youtube-player API, but for now, the 'autoplay' param toggle forces reload.
            // A better UX for simple iframe is just controls=1, but we want custom controls.
            // Let's stick to the simple toggle for now, accepting the reload.
        } else if (videoRef.current) {
            if (isPlaying) videoRef.current.pause();
            else videoRef.current.play();
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const current = videoRef.current.currentTime;
            const duration = videoRef.current.duration || 1;
            setProgress((current / duration) * 100);
        }
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
                                {/* Overlay to intercept clicks for custom controls if needed, 
                                    but implementing full YouTube API is complex. 
                                    For now, let's keep it simple: if paused, render overlay. 
                                */}
                            </div>
                        ) : (
                            <video
                                ref={videoRef}
                                className="w-full h-full object-cover"
                                src={clip.url} // Local file URL
                                loop
                                playsInline
                                autoPlay
                                onTimeUpdate={handleTimeUpdate}
                                onClick={togglePlay}
                            />
                        )}
                    </motion.div>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 text-zinc-500 space-y-4">
                        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center animate-pulse">
                            <Play className="w-8 h-8 opacity-20" />
                        </div>
                        <p className="text-sm font-medium">Select a clip to preview</p>
                    </div>
                )}
            </AnimatePresence>

            {/* Caption Overlay Area (Mock - Only show for local video or specific condition) */}
            {clip && !isYouTube && (
                <div className="absolute bottom-32 left-8 right-8 text-center pointer-events-none z-10">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
                        animate={{ scale: 1, opacity: 1, rotate: -2 }}
                        transition={{ delay: 0.5, type: 'spring' }}
                    >
                        <span className="bg-yellow-400 text-black px-2 py-1 text-2xl font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black inline-block">
                            Viral
                        </span>
                        <br />
                        <span className="text-white text-3xl font-black drop-shadow-[0_2px_0px_rgba(0,0,0,1)] stroke-black" style={{ WebkitTextStroke: '1px black' }}>
                            MOMENTS
                        </span>
                    </motion.div>
                </div>
            )}

            {/* Custom Controls - Hidden for YouTube for now to avoid conflict/complexity */}
            {!isYouTube && (
                <div className={cn(
                    "absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-12 transition-opacity duration-300 z-20",
                    !clip ? "opacity-0 pointer-events-none" : "opacity-100"
                )}>
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-mono text-white/80">
                            {clip && isYouTube ? `${Math.floor(clip.startTime)}s` : "00:00"}
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

                        <div className="w-5" /> {/* Spacer for symmetry */}
                    </div>
                </div>
            )}
        </div>
    );
}
