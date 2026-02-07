'use client';

import { Play, Download, Wand2, Star, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from 'react';
import Image from "next/image"; // Added
import { Clip } from "@/lib/video/types";
import { motion, AnimatePresence } from "framer-motion";
import { generateClip } from "@/lib/video/actions";


// Enhanced Mock Data
const MOCK_CLIPS: Clip[] = [
    {
        id: 1,
        title: "Scaling The Business",
        score: 98,
        duration: "00:54",
        url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        videoId: "mock_1", // Added
        startTime: 0, // Added
        endTime: 54, // Added
        segments: [], // Added
        thumbnailUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80",
        transcript: [
            { timestamp: "00:00", text: "The first thing was realizing that scale breaks everything." },
            { timestamp: "00:04", text: "You can't just throw people at the problem." },
            { timestamp: "00:08", text: "Systems are the only way to survive growth." },
            { timestamp: "00:15", text: "It was a painful lesson to learn." }
        ]
    },
    {
        id: 2,
        title: "The First Million",
        score: 92,
        duration: "00:42",
        url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        videoId: "mock_2", // Added
        startTime: 0, // Added
        endTime: 42, // Added
        segments: [], // Added
        thumbnailUrl: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=800&q=80",
        transcript: [
            { timestamp: "00:00", text: "Making the first million is purely about sales." },
            { timestamp: "00:05", text: "Forget branding, forget logo design." },
            { timestamp: "00:10", text: "Just sell the product." },
            { timestamp: "00:20", text: "If you can't sell it, you don't have a business." }
        ]
    },
    {
        id: 3,
        title: "Hiring Mistakes",
        score: 85,
        duration: "01:12",
        url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        videoId: "mock_3", // Added
        startTime: 0, // Added
        endTime: 72, // Added
        segments: [], // Added
        thumbnailUrl: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&q=80",
        transcript: [
            { timestamp: "00:00", text: "I hired for skill, not culture." },
            { timestamp: "00:04", text: "That was a disaster." },
            { timestamp: "00:09", text: "One toxic person can ruin the whole team." },
            { timestamp: "00:18", text: "Always optimize for integrity first." },
            { timestamp: "00:25", text: "Skills can be taught, character cannot." }
        ]
    },
];


interface ClipRailProps {
    onSelect: (clip: Clip) => void;
    activeClipId?: number | string;
    clips: Clip[];
    projectId?: string; // Added prop
}

export function ClipRail({ onSelect, activeClipId, clips = [], projectId }: ClipRailProps) {
    const [downloadingId, setDownloadingId] = useState<number | string | null>(null);
    const [isGeneratingMore, setIsGeneratingMore] = useState(false);

    const handleSelect = (clip: Clip) => {
        onSelect(clip);
    };

    const handleDownload = async (e: React.MouseEvent, clip: Clip) => {
        e.stopPropagation();
        setDownloadingId(clip.id);

        try {
            const segments = clip.segments || [{ start: clip.startTime, end: clip.endTime }];
            const result = await generateClip(clip.url, segments);

            if (result.error) {
                alert(`Error: ${result.error}`);
            } else if (result.path) {
                // Programmatic click to trigger browser download
                const link = document.createElement('a');
                link.href = result.path;
                link.download = `ncliper_clip_${clip.id}.mp4`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (error) {
            console.error(error);
            alert("Failed to generate clip");
        } finally {
            setDownloadingId(null);
        }
    };

    const handleGenerateMore = async () => {
        if (!projectId || clips.length === 0) return;
        setIsGeneratingMore(true);
        try {
            // Import dynamically or use the import at top if available. 
            // Wait, generateMoreClipsAction needs to be imported.
            // I'll assume it's available via module import 'actions' below.
            const { generateMoreClipsAction } = await import('@/lib/video/actions');
            await generateMoreClipsAction(clips[0].url, projectId);

            // Reload page to see new clips? Or invalidate query.
            // For MVP, simple reload is safest to fetch new state.
            window.location.reload();
        } catch (e) {
            console.error(e);
            alert("Failed to generate more clips");
        } finally {
            setIsGeneratingMore(false);
        }
    };

    return (
        <div className="w-80 h-full border-r border-border bg-card/30 flex flex-col backdrop-blur-md">
            <div className="p-4 border-b border-white/5 bg-card/50 backdrop-blur-sm">
                <h3 className="font-semibold text-white flex items-center gap-2 tracking-tight">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 animate-[spin_10s_linear_infinite]" />
                    Viral Shorts
                    <span className="ml-auto text-[10px] font-bold text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full border border-white/5">
                        {clips.length} CLIPS
                    </span>
                </h3>
            </div>

            {/* ... List ... */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                <AnimatePresence>
                    {clips.map((clip, index) => {
                        const isActive = activeClipId === clip.id;
                        return (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                key={clip.id}
                                onClick={() => handleSelect(clip)}
                                className={cn(
                                    "group relative rounded-2xl overflow-hidden cursor-pointer border transition-all duration-300",
                                    isActive
                                        ? "bg-secondary/40 border-primary/50 shadow-[0_0_30px_-5px_rgba(124,58,237,0.3)] scale-[1.02]"
                                        : "bg-card border-white/5 hover:border-white/20 hover:bg-white/5"
                                )}
                            >
                                {/* Thumbnail Area */}
                                <div className="aspect-video w-full bg-black relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                                    <Image
                                        src={clip.thumbnailUrl}
                                        alt={clip.title}
                                        fill
                                        className={cn(
                                            "object-cover transition-transform duration-700",
                                            isActive ? "scale-110" : "group-hover:scale-105"
                                        )}
                                    />

                                    {/* Score Badge */}
                                    <div className="absolute top-2 left-2 z-20">
                                        <div className={cn(
                                            "px-2 py-1 rounded-lg text-[10px] font-bold border backdrop-blur-md shadow-lg",
                                            clip.score >= 90
                                                ? "bg-green-500/20 text-green-400 border-green-500/30"
                                                : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                        )}>
                                            SCORE {clip.score}
                                        </div>
                                    </div>

                                    {/* Duration Badge */}
                                    <div className="absolute top-2 right-2 z-20">
                                        <div className="px-2 py-1 rounded-lg bg-black/60 text-white/80 text-[10px] font-mono border border-white/10 backdrop-blur-md flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {clip.duration}
                                        </div>
                                    </div>

                                    {/* Play Overlay */}
                                    <div className={cn(
                                        "absolute inset-0 z-20 flex items-center justify-center transition-all duration-300",
                                        isActive ? "opacity-100 bg-black/20" : "opacity-0 group-hover:opacity-100 bg-black/40"
                                    )}>
                                        <div className={cn(
                                            "w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg transform transition-transform",
                                            isActive ? "scale-100" : "scale-90 group-hover:scale-100"
                                        )}>
                                            <Play className="w-4 h-4 fill-current ml-0.5" />
                                        </div>
                                    </div>
                                </div>

                                {/* Content Area */}
                                <div className="p-3">
                                    <h4 className={cn(
                                        "font-bold text-sm line-clamp-1 mb-1 transition-colors",
                                        isActive ? "text-primary" : "text-white group-hover:text-white"
                                    )}>
                                        {clip.title}
                                    </h4>

                                    <div className="flex items-center justify-between mt-3">
                                        <div className="flex -space-x-1.5 overflow-hidden">
                                            {/* Mock avatars for "viewers" or similar delight */}
                                            <div className="inline-block h-5 w-5 rounded-full ring-2 ring-card bg-orange-500" />
                                            <div className="inline-block h-5 w-5 rounded-full ring-2 ring-card bg-blue-500" />
                                            <div className="inline-block h-5 w-5 rounded-full ring-2 ring-card bg-purple-500" />
                                        </div>

                                        <button
                                            onClick={(e) => handleDownload(e, clip)}
                                            className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                                                downloadingId === clip.id
                                                    ? "bg-green-500 text-white"
                                                    : "bg-secondary text-muted-foreground hover:bg-white hover:text-black"
                                            )}
                                        >
                                            {downloadingId === clip.id ? (
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ repeat: Infinity, duration: 1 }}
                                                >
                                                    <Wand2 className="w-3.5 h-3.5" />
                                                </motion.div>
                                            ) : (
                                                <Download className="w-3.5 h-3.5" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Active Indicator Bar */}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeIndicator"
                                        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-purple-500"
                                    />
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            <div className="p-4 border-t border-white/5 bg-card/50">
                <button
                    onClick={handleGenerateMore}
                    disabled={isGeneratingMore || !projectId}
                    className="w-full relative overflow-hidden group flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground hover:text-white p-3 rounded-xl border border-dashed border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    <span className="relative z-10 flex items-center gap-2">
                        {isGeneratingMore ? <Wand2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5 group-hover:animate-pulse" />}
                        {isGeneratingMore ? 'Generating...' : 'Generate More Clips'}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                </button>
            </div>
        </div>
    );
}
