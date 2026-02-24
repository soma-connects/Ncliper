'use client';

import { Minus, Plus } from 'lucide-react';

interface TimestampTunerProps {
    startTime: number;
    endTime: number;
    onStartChange: (newStart: number) => void;
    onEndChange: (newEnd: number) => void;
}

export function TimestampTuner({ startTime, endTime, onStartChange, onEndChange }: TimestampTunerProps) {
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.round((seconds % 1) * 10);
        return `${m}:${s.toString().padStart(2, '0')}.${ms}`;
    };

    return (
        <div className="flex items-center gap-4 px-4 py-3 bg-card/40 border border-white/5 rounded-xl backdrop-blur-sm">
            {/* Start Time */}
            <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Start</span>
                <button
                    onClick={() => onStartChange(Math.max(0, startTime - 1))}
                    className="w-6 h-6 rounded-md bg-secondary/80 flex items-center justify-center hover:bg-secondary text-white transition-colors"
                >
                    <Minus className="w-3 h-3" />
                </button>
                <button
                    onClick={() => onStartChange(Math.max(0, startTime - 0.5))}
                    className="text-[9px] px-1.5 py-1 rounded bg-secondary/50 text-muted-foreground hover:text-white transition-colors"
                >
                    -0.5
                </button>
                <span className="text-sm font-mono text-white min-w-[60px] text-center font-bold">
                    {formatTime(startTime)}
                </span>
                <button
                    onClick={() => onStartChange(startTime + 0.5)}
                    className="text-[9px] px-1.5 py-1 rounded bg-secondary/50 text-muted-foreground hover:text-white transition-colors"
                >
                    +0.5
                </button>
                <button
                    onClick={() => onStartChange(startTime + 1)}
                    className="w-6 h-6 rounded-md bg-secondary/80 flex items-center justify-center hover:bg-secondary text-white transition-colors"
                >
                    <Plus className="w-3 h-3" />
                </button>
            </div>

            <div className="h-4 w-[1px] bg-border" />

            {/* End Time */}
            <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">End</span>
                <button
                    onClick={() => onEndChange(Math.max(startTime + 1, endTime - 1))}
                    className="w-6 h-6 rounded-md bg-secondary/80 flex items-center justify-center hover:bg-secondary text-white transition-colors"
                >
                    <Minus className="w-3 h-3" />
                </button>
                <button
                    onClick={() => onEndChange(Math.max(startTime + 1, endTime - 0.5))}
                    className="text-[9px] px-1.5 py-1 rounded bg-secondary/50 text-muted-foreground hover:text-white transition-colors"
                >
                    -0.5
                </button>
                <span className="text-sm font-mono text-white min-w-[60px] text-center font-bold">
                    {formatTime(endTime)}
                </span>
                <button
                    onClick={() => onEndChange(endTime + 0.5)}
                    className="text-[9px] px-1.5 py-1 rounded bg-secondary/50 text-muted-foreground hover:text-white transition-colors"
                >
                    +0.5
                </button>
                <button
                    onClick={() => onEndChange(endTime + 1)}
                    className="w-6 h-6 rounded-md bg-secondary/80 flex items-center justify-center hover:bg-secondary text-white transition-colors"
                >
                    <Plus className="w-3 h-3" />
                </button>
            </div>

            {/* Duration Badge */}
            <div className="ml-auto">
                <span className="text-[10px] px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 font-bold border border-purple-500/20">
                    {Math.round(endTime - startTime)}s
                </span>
            </div>
        </div>
    );
}
