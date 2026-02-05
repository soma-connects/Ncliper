'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClipRail } from "@/components/editor/ClipRail";
import { VideoPlayer } from "@/components/editor/VideoPlayer";
import { TranscriptEditor } from "@/components/editor/TranscriptEditor";
import { Download, Wand2 } from "lucide-react";
import { Clip } from "@/lib/video/types";
import { cn } from "@/lib/utils";
import { getProjectClips } from "@/lib/video/actions";

interface EditorViewProps {
    projectTitle: string;
    projectId: string;
    initialClips?: Clip[];
}

export function EditorView({ projectTitle, projectId, initialClips = [] }: EditorViewProps) {
    const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [selectedTab, setSelectedTab] = useState<'clips' | 'player' | 'transcript'>('clips');

    // Use initialClips if provided, otherwise fallback to query (for re-visits or deep links)
    const { data: fetchedClips } = useQuery({
        queryKey: ['clips', projectId],
        queryFn: async () => {
            const result = await getProjectClips(projectId);
            return result || [];
        },
        enabled: !!projectId && initialClips.length === 0,
        initialData: initialClips
    });

    const clips = initialClips.length > 0 ? initialClips : (fetchedClips || []);

    // Auto-select first clip
    if (!selectedClip && clips && clips.length > 0) {
        setSelectedClip(clips[0]);
    }

    const handleExportAll = () => {
        setIsExporting(true);
        // Mock export
        setTimeout(() => {
            setIsExporting(false);
            alert("All clips exported successfully!");
        }, 2000);
    };

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col animate-in fade-in zoom-in-95 duration-500">
            {/* Editor Toolbar */}
            <div className="flex items-center justify-between mb-6 px-4">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                        {projectTitle}
                        <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs font-bold border border-green-500/20">
                            PRO
                        </span>
                    </h2>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Project auto-saved
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-secondary/50 text-white rounded-xl text-sm font-medium hover:bg-secondary hover:text-white transition-all border border-white/5 hover:border-white/20">
                        <Wand2 className="w-4 h-4 text-purple-400" />
                        <span>AI Magic</span>
                    </button>

                    <button
                        onClick={handleExportAll}
                        className="flex items-center gap-2 px-6 py-2 bg-white text-black rounded-xl text-sm font-bold shadow-lg shadow-white/10 hover:shadow-white/20 hover:scale-105 transition-all"
                    >
                        {isExporting ? (
                            <Wand2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Download className="w-4 h-4" />
                        )}
                        <span>{isExporting ? 'Exporting...' : 'Export All'}</span>
                    </button>
                </div>
            </div>

            {/* Main Editor Grid - Responsive Layout */}
            {/* Desktop: Rail | Player | Transcript */}
            <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden min-h-0 px-2 pb-2 relative">

                {/* Mobile Tabs (Visible only on lg and below) */}
                <div className="lg:hidden flex items-center justify-center gap-4 mb-4 shrink-0">
                    <button
                        onClick={() => setSelectedTab('clips')}
                        className={cn("px-4 py-2 rounded-full text-sm font-bold transition-colors", selectedTab === 'clips' ? "bg-white text-black" : "bg-secondary text-muted-foreground")}
                    >Clips</button>
                    <button
                        onClick={() => setSelectedTab('player')}
                        className={cn("px-4 py-2 rounded-full text-sm font-bold transition-colors", selectedTab === 'player' ? "bg-white text-black" : "bg-secondary text-muted-foreground")}
                    >Preview</button>
                    <button
                        onClick={() => setSelectedTab('transcript')}
                        className={cn("px-4 py-2 rounded-full text-sm font-bold transition-colors", selectedTab === 'transcript' ? "bg-white text-black" : "bg-secondary text-muted-foreground")}
                    >Edit</button>
                </div>

                {/* 1. Clip Rail (Left) */}
                <div className={cn(
                    "lg:block h-full shrink-0 lg:w-80 transition-all",
                    selectedTab === 'clips' ? "block w-full" : "hidden"
                )}>
                    <ClipRail
                        clips={clips}
                        onSelect={(clip) => {
                            setSelectedClip(clip);
                            if (window.innerWidth < 1024) setSelectedTab('player'); // Auto-switch to player on mobile
                        }}
                        activeClipId={selectedClip?.id}
                    />
                </div>

                {/* 2. Main Player Area (Center) */}
                <div className={cn(
                    "flex-1 flex-col items-center justify-center bg-card/30 rounded-3xl border border-white/5 p-4 lg:p-8 relative overflow-hidden backdrop-blur-sm group lg:flex",
                    selectedTab === 'player' ? "flex" : "hidden"
                )}>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />

                    {/* Background Glows */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 blur-[100px] rounded-full pointer-events-none opacity-50" />

                    <div className="z-10 w-full h-full flex items-center justify-center">
                        <VideoPlayer clip={selectedClip} />
                    </div>
                </div>

                {/* 3. Transcript/Metadata (Right) */}
                <div className={cn(
                    "lg:block h-full shrink-0 lg:w-80 transition-all",
                    selectedTab === 'transcript' ? "block w-full" : "hidden"
                )}>
                    <TranscriptEditor transcript={selectedClip?.transcript} />
                </div>
            </div>
        </div>
    );
}
