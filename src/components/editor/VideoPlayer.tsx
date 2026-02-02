'use client';

import { Play, Pause, SkipBack, SkipForward, Maximize2, Volume2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
    src?: string | null;
}

export function VideoPlayer({ src }: VideoPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Reset playing state when src changes
    useEffect(() => {
        setIsPlaying(false);
        if (videoRef.current) videoRef.current.load();
    }, [src]);

    const togglePlay = () => {
        if (videoRef.current && src) {
            if (isPlaying) videoRef.current.pause();
            else videoRef.current.play();
            setIsPlaying(!isPlaying);
        }
    };

    return (
        <div className="relative w-full max-w-[360px] aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-card mx-auto group">
            {/* Video Element */}
            {src ? (
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    src={src}
                    loop
                    playsInline
                />
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 text-zinc-500 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
                        <Play className="w-8 h-8 opacity-20" />
                    </div>
                    <p className="text-sm font-medium">Select a clip to preview</p>
                </div>
            )}

            {/* Caption Overlay Area (Mock) */}
            {src && (
                <div className="absolute bottom-32 left-8 right-8 text-center pointer-events-none">
                    <span className="bg-yellow-400 text-black px-2 py-1 text-2xl font-bold uppercase shadow-lg border-2 border-black transform -rotate-2 inline-block">
                        Viral
                    </span>
                    <br />
                    <span className="text-white text-3xl font-black drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] stroke-black" style={{ WebkitTextStroke: '1px black' }}>
                        MOMENTS
                    </span>
                </div>
            )}

            {/* Custom Controls */}
            <div className={cn(
                "absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-12 transition-opacity duration-300",
                !src ? "opacity-0 pointer-events-none" : "opacity-100"
            )}>
                <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono text-white/80">00:14 / 01:30</span>
                    <Maximize2 className="w-4 h-4 text-white/80 hover:text-white cursor-pointer" />
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-white/20 rounded-full mb-6 cursor-pointer group">
                    <div className="h-full bg-primary w-1/3 rounded-full relative group-hover:bg-primary/80 transition-colors">
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </div>

                {/* Main Controls */}
                <div className="flex items-center justify-between px-4">
                    <Volume2 className="w-5 h-5 text-white/50 hover:text-white cursor-pointer" />

                    <div className="flex items-center gap-6">
                        <SkipBack className="w-6 h-6 text-white hover:text-primary transition-colors cursor-pointer" />

                        <button
                            onClick={togglePlay}
                            className="w-14 h-14 rounded-full bg-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/10"
                        >
                            {isPlaying ? (
                                <Pause className="w-6 h-6 text-black fill-current" />
                            ) : (
                                <Play className="w-6 h-6 text-black fill-current ml-1" />
                            )}
                        </button>

                        <SkipForward className="w-6 h-6 text-white hover:text-primary transition-colors cursor-pointer" />
                    </div>

                    <div className="w-5" /> {/* Spacer for symmetry */}
                </div>
            </div>
        </div>
    );
}
