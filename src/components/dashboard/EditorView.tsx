'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClipRail } from "@/components/editor/ClipRail";
import { VideoPlayer } from "@/components/editor/VideoPlayer";
import { PromptToClipBar } from "@/components/editor/PromptToClipBar";
import { TimestampTuner } from "@/components/editor/TimestampTuner";
import { CopyrightModal } from "@/components/editor/CopyrightModal";
import { Download, Wand2, Clock, Zap, Copy, Check, FileText } from "lucide-react";
import { Clip } from "@/lib/video/types";
import { cn } from "@/lib/utils";
import { getProjectClips } from "@/lib/video/actions";

interface EditorViewProps {
    projectTitle: string;
    projectId: string;
    initialClips?: Clip[];
    onNewProject?: () => void;
}

export function EditorView({ projectTitle, projectId, initialClips = [], onNewProject }: EditorViewProps) {
    // Editor State
    const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [selectedTab, setSelectedTab] = useState<'clips' | 'player'>('clips');
    const [copiedTranscript, setCopiedTranscript] = useState(false);

    // Clipping / Tuning State
    const [activeMatch, setActiveMatch] = useState<{ start_time: number; end_time: number; snippet: string; confidence: number } | null>(null);
    const [tunedStart, setTunedStart] = useState(0);
    const [tunedEnd, setTunedEnd] = useState(0);
    const [videoTime, setVideoTime] = useState(0);
    const [seekTarget, setSeekTarget] = useState<number | null>(null);
    const [showCopyrightModal, setShowCopyrightModal] = useState(false);

    // ... (query setup remains same) ...
    // Use initialClips if provided, otherwise fallback to query
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
        setTimeout(() => {
            setIsExporting(false);
            alert("All clips exported successfully!");
        }, 2000);
    };

    const handleCopyTranscript = () => {
        if (!selectedClip?.transcript) return;
        const text = selectedClip.transcript.map(t => t.text).join(' ');
        navigator.clipboard.writeText(text);
        setCopiedTranscript(true);
        setTimeout(() => setCopiedTranscript(false), 2000);
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-400 bg-green-500/10 border-green-500/20';
        if (score >= 70) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
        return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
    };

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col animate-in fade-in zoom-in-95 duration-500">
            {/* ... (Editor Toolbar remains same) ... */}
            {/* Editor Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6 px-2 sm:px-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                            {projectTitle}
                            <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs font-bold border border-green-500/20">
                                PRO
                            </span>
                        </h2>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        {clips.length} clips generated · Auto-saved
                    </p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    {onNewProject && (
                        <button
                            onClick={onNewProject}
                            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-secondary/80 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-secondary transition-all"
                        >
                            + New Project
                        </button>
                    )}
                    <button
                        onClick={handleExportAll}
                        className="flex items-center gap-2 px-4 sm:px-6 py-2 bg-white text-black rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-white/10 hover:shadow-white/20 hover:scale-105 transition-all"
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

            {/* Mobile Tabs */}
            <div className="lg:hidden flex items-center justify-center gap-4 mb-4 shrink-0 px-2">
                <button
                    onClick={() => setSelectedTab('clips')}
                    className={cn("px-4 py-2 rounded-full text-sm font-bold transition-colors", selectedTab === 'clips' ? "bg-white text-black" : "bg-secondary text-muted-foreground")}
                >Clips</button>
                <button
                    onClick={() => setSelectedTab('player')}
                    className={cn("px-4 py-2 rounded-full text-sm font-bold transition-colors", selectedTab === 'player' ? "bg-white text-black" : "bg-secondary text-muted-foreground")}
                >Preview</button>
            </div>

            {/* Main Editor: Vertical Layout */}
            <div className="flex-1 overflow-y-auto min-h-0 px-2 sm:px-4 pb-12 relative custom-scrollbar w-full">
                <div className="max-w-7xl mx-auto flex flex-col gap-8 w-full">

                    {/* Top: Main Player + Details */}
                    <div className={cn(
                        "w-full flex-col lg:flex",
                        selectedTab === 'player' ? "flex" : "hidden"
                    )}>

                        {/* Top: Prompt-to-Clip AI Director Bar */}
                        <div className="mb-4">
                            <PromptToClipBar
                                projectId={projectId}
                                onMatchSelect={(match) => {
                                    setActiveMatch(match);
                                    setTunedStart(match.start_time);
                                    setTunedEnd(match.end_time);
                                    const previewClip: Clip = {
                                        id: 'prompt-preview',
                                        title: match.snippet,
                                        score: match.confidence,
                                        duration: `${Math.round(match.end_time - match.start_time)}s`,
                                        url: selectedClip?.url || clips[0]?.url || '',
                                        videoId: selectedClip?.videoId || clips[0]?.videoId || '',
                                        thumbnailUrl: '',
                                        startTime: match.start_time,
                                        endTime: match.end_time,
                                        segments: [{ start: match.start_time, end: match.end_time }],
                                        transcript: [],
                                    };
                                    setSelectedClip(previewClip);
                                    setSeekTarget(match.start_time);
                                }}
                            />
                        </div>

                        {/* Center: Player + Clip Details Side by Side */}
                        <div className="flex-1 flex flex-col xl:flex-row gap-6 min-h-0">

                            {/* Video Player Column */}
                            <div className="flex flex-col items-center justify-start gap-4 xl:flex-1">
                                <div className="relative bg-card/30 rounded-3xl border border-white/5 p-4 lg:p-6 overflow-hidden backdrop-blur-sm w-full flex items-center justify-center">
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/10 blur-[100px] rounded-full pointer-events-none opacity-50" />
                                    <div className="z-10">
                                        <VideoPlayer 
                                            clip={selectedClip} 
                                            onTimeUpdate={setVideoTime}
                                            onMarkIn={(time) => {
                                                setTunedStart(Number(time.toFixed(1)));
                                                if (selectedClip) setSelectedClip({ ...selectedClip, startTime: time });
                                            }}
                                            onMarkOut={(time) => {
                                                setTunedEnd(Number(time.toFixed(1)));
                                                if (selectedClip) setSelectedClip({ ...selectedClip, endTime: time });
                                            }}
                                            seekTo={seekTarget}
                                        />
                                    </div>
                                </div>

                                {/* Timestamp Tuner (when AI Director is active) */}
                                {activeMatch && (
                                    <div className="w-full space-y-3 animate-in slide-in-from-bottom-3 duration-300">
                                        <TimestampTuner
                                            startTime={tunedStart}
                                            endTime={tunedEnd}
                                            onStartChange={(newStart) => {
                                                const start = Number(newStart.toFixed(1));
                                                setTunedStart(start);
                                                setSeekTarget(start);
                                                if (selectedClip) {
                                                    setSelectedClip({ ...selectedClip, startTime: start });
                                                }
                                            }}
                                            onEndChange={(newEnd) => {
                                                const end = Number(newEnd.toFixed(1));
                                                setTunedEnd(end);
                                                setSeekTarget(end);
                                                if (selectedClip) {
                                                    setSelectedClip({ ...selectedClip, endTime: end });
                                                }
                                            }}
                                            onMarkStart={() => {
                                                const time = Number(videoTime.toFixed(1));
                                                setTunedStart(time);
                                                if (selectedClip) setSelectedClip({ ...selectedClip, startTime: time });
                                            }}
                                            onMarkEnd={() => {
                                                const time = Number(videoTime.toFixed(1));
                                                setTunedEnd(time);
                                                if (selectedClip) setSelectedClip({ ...selectedClip, endTime: time });
                                            }}
                                        />
                                        <button
                                            onClick={() => setShowCopyrightModal(true)}
                                            className="w-full py-3 bg-gradient-to-r from-purple-600 to-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Wand2 className="w-4 h-4" />
                                            Generate This Clip
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Clip Details Panel (Right - replaces old Transcript sidebar) */}
                            {selectedClip && (
                                <div className="xl:w-80 shrink-0 space-y-4 animate-in fade-in slide-in-from-right-3 duration-300">

                                    {/* Clip Info Card */}
                                    <div className="bg-card/40 border border-white/5 rounded-2xl p-5 space-y-4">
                                        <h3 className="text-white font-bold text-base truncate">{selectedClip.title}</h3>

                                        {/* Stats Row */}
                                        <div className="flex items-center gap-3">
                                            <span className={cn("px-2.5 py-1 rounded-lg text-[11px] font-bold border", getScoreColor(selectedClip.score))}>
                                                <Zap className="w-3 h-3 inline mr-1" />
                                                Score {selectedClip.score}
                                            </span>
                                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono text-muted-foreground bg-secondary/50 border border-white/5">
                                                <Clock className="w-3 h-3 inline mr-1" />
                                                {selectedClip.duration}
                                            </span>
                                        </div>

                                        {/* Segment Info */}
                                        {selectedClip.segments && selectedClip.segments.length > 0 && (
                                            <div className="space-y-1.5">
                                                <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Segments</p>
                                                {selectedClip.segments.map((seg, i) => (
                                                    <div key={i} className="flex items-center gap-2 text-xs">
                                                        <span className="w-5 h-5 rounded bg-primary/10 text-primary font-bold flex items-center justify-center text-[10px]">{i + 1}</span>
                                                        <span className="font-mono text-muted-foreground">
                                                            {Math.floor(seg.start / 60)}:{Math.floor(seg.start % 60).toString().padStart(2, '0')} →{' '}
                                                            {Math.floor(seg.end / 60)}:{Math.floor(seg.end % 60).toString().padStart(2, '0')}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Transcript Preview Card */}
                                    {selectedClip.transcript && selectedClip.transcript.length > 0 && (
                                        <div className="bg-card/40 border border-white/5 rounded-2xl p-5 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-xs uppercase text-muted-foreground font-bold tracking-wider flex items-center gap-1.5">
                                                    <FileText className="w-3.5 h-3.5" />
                                                    Transcript
                                                </h4>
                                                <button
                                                    onClick={handleCopyTranscript}
                                                    className="text-[10px] text-muted-foreground hover:text-white flex items-center gap-1 transition-colors"
                                                >
                                                    {copiedTranscript ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                                    {copiedTranscript ? 'Copied!' : 'Copy'}
                                                </button>
                                            </div>
                                            <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-2">
                                                {selectedClip.transcript.map((seg, i) => (
                                                    <div key={i} className="flex gap-2">
                                                        <span className="text-[10px] font-mono text-primary/60 mt-0.5 shrink-0 w-8">{seg.timestamp}</span>
                                                        <p className="text-xs text-muted-foreground leading-relaxed">{seg.text}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Quick Actions */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                if (selectedClip) {
                                                    const link = document.createElement('a');
                                                    link.href = selectedClip.url;
                                                    link.download = `ncliper_${selectedClip.id}.mp4`;
                                                    link.click();
                                                }
                                            }}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white text-black rounded-xl text-xs font-bold hover:scale-[1.02] active:scale-95 transition-all"
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                            Download
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom: Clip Grid */}
                    <div className={cn(
                        "w-full pt-8 lg:pt-12 border-t border-white/5",
                        selectedTab === 'clips' ? "block" : "hidden lg:block"
                    )}>
                        <ClipRail
                            clips={clips}
                            projectId={projectId}
                            onSelect={(clip) => {
                                setSelectedClip(clip);
                                setActiveMatch(null);
                                if (window.innerWidth < 1024) {
                                    setSelectedTab('player');
                                }
                            }}
                            activeClipId={selectedClip?.id}
                        />
                    </div>

                </div>
            </div>

            {/* Copyright Modal */}
            <CopyrightModal
                isOpen={showCopyrightModal}
                onClose={() => setShowCopyrightModal(false)}
                clipDuration={Math.round(tunedEnd - tunedStart)}
                onConfirm={() => {
                    setShowCopyrightModal(false);
                    alert(`Clip generation queued! (${tunedStart}s - ${tunedEnd}s). Will be available in your Clip Rail shortly.`);
                    setActiveMatch(null);
                }}
            />
        </div>
    );
}
