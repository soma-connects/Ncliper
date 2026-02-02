'use client';

import { Play, Download, Wand2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from 'react';

// Mock Data with Sample Videos
const MOCK_CLIPS = [
    {
        id: 1,
        title: "Scaling The Business",
        score: 98,
        duration: "00:54",
        url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
    },
    {
        id: 2,
        title: "The First Million",
        score: 92,
        duration: "00:42",
        url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
    },
    {
        id: 3,
        title: "Hiring Mistakes",
        score: 85,
        duration: "01:12",
        url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"
    },
];

interface ClipRailProps {
    onSelect: (url: string) => void;
}

export function ClipRail({ onSelect }: ClipRailProps) {
    const [activeId, setActiveId] = useState<number | null>(null);

    const handleSelect = (clip: typeof MOCK_CLIPS[0]) => {
        setActiveId(clip.id);
        onSelect(clip.url);
    };

    const handleDownload = (e: React.MouseEvent, title: string) => {
        e.stopPropagation();
        // In a real app, this would trigger a file download
        alert(`Downloading clip: "${title}"`);
    };

    return (
        <div className="w-80 h-full border-r border-border bg-card/30 flex flex-col">
            <div className="p-4 border-b border-border bg-card/50 backdrop-blur-sm">
                <h3 className="font-semibold text-white flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    Viral Shorts
                    <span className="ml-auto text-xs font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                        {MOCK_CLIPS.length} generated
                    </span>
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {MOCK_CLIPS.map((clip) => {
                    const isActive = activeId === clip.id;
                    return (
                        <div
                            key={clip.id}
                            onClick={() => handleSelect(clip)}
                            className={cn(
                                "group p-3 rounded-xl border transition-all cursor-pointer relative overflow-hidden",
                                isActive
                                    ? "bg-primary/5 border-primary/50 shadow-[0_0_15px_rgba(139,92,246,0.1)]"
                                    : "bg-card border-border hover:border-primary/30"
                            )}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className={cn(
                                    "px-2 py-0.5 rounded-md text-[10px] font-bold border",
                                    clip.score >= 90 ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                )}>
                                    SCORE {clip.score}
                                </div>
                                <span className="text-[10px] text-muted-foreground font-mono">{clip.duration}</span>
                            </div>

                            <h4 className="text-sm font-medium text-white line-clamp-2 leading-tight mb-3">
                                {clip.title}
                            </h4>

                            <div className={cn(
                                "flex items-center gap-2 transition-opacity duration-200",
                                isActive ? "opacity-100 translate-y-0" : "opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                            )}>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleSelect(clip); }}
                                    className="flex-1 flex items-center justify-center gap-1.5 bg-white text-black text-[10px] font-bold py-1.5 rounded-lg hover:bg-gray-100"
                                >
                                    <Play className="w-3 h-3" /> {isActive ? 'PLAYING' : 'PREVIEW'}
                                </button>
                                <button
                                    onClick={(e) => handleDownload(e, clip.title)}
                                    className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary text-white hover:bg-primary hover:text-white transition-colors"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* Active Indicator Strip */}
                            {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                        </div>
                    );
                })}
            </div>

            <div className="p-4 border-t border-border bg-card/50">
                <button className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground hover:text-white p-3 rounded-xl border border-dashed border-border hover:bg-secondary/50 transition-colors">
                    <Wand2 className="w-3.5 h-3.5" />
                    Generate More Clips
                </button>
            </div>
        </div>
    );
}
