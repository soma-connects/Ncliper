'use client';

import { useState } from 'react';
import { ClipRail } from "../editor/ClipRail";
import { VideoPlayer } from "../editor/VideoPlayer";
import { Download, Share2, Wand2 } from "lucide-react";

interface EditorViewProps {
    projectTitle: string;
}

export function EditorView({ projectTitle }: EditorViewProps) {
    const [selectedClipUrl, setSelectedClipUrl] = useState<string | null>(null);

    const handleExportAll = () => {
        alert("Downloading all clips...");
    };

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col animate-in fade-in zoom-in-95 duration-500">
            {/* Editor Toolbar */}
            <div className="flex items-center justify-between mb-6 px-2">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">{projectTitle}</h2>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        All clips generated successfully
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-xl text-sm font-medium hover:bg-secondary/80 transition-colors">
                        <Wand2 className="w-4 h-4" />
                        <span>AI Magic</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-xl text-sm font-medium hover:bg-secondary/80 transition-colors">
                        <Share2 className="w-4 h-4" />
                        <span>Share</span>
                    </button>
                    <button
                        onClick={handleExportAll}
                        className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-primary/50 hover:scale-105 transition-all"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export All</span>
                    </button>
                </div>
            </div>

            {/* Main Editor Grid */}
            <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
                {/* Left: Clips */}
                <ClipRail onSelect={setSelectedClipUrl} />

                {/* Center: Player */}
                <div className="flex-1 flex flex-col items-center justify-center bg-card/10 rounded-3xl border border-white/5 p-8 relative overflow-hidden backdrop-blur-sm">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
                    {/* Pass the selected clip URL to the player */}
                    <VideoPlayer src={selectedClipUrl} />
                </div>
            </div>
        </div>
    );
}
