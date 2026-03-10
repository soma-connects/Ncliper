'use client';

import { Minus, Plus, MapPin } from 'lucide-react';

interface TimestampTunerProps {
    startTime: number;
    endTime: number;
    onStartChange: (newStart: number) => void;
    onEndChange: (newEnd: number) => void;
    onMarkStart?: () => void;
    onMarkEnd?: () => void;
}

export function TimestampTuner({ 
    startTime, 
    endTime, 
    onStartChange, 
    onEndChange,
    onMarkStart,
    onMarkEnd
}: TimestampTunerProps) {
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.round((seconds % 1) * 10);
        return `${m}:${s.toString().padStart(2, '0')}.${ms}`;
    };

    return (
        <div className="flex flex-col sm:flex-row items-center gap-4 px-4 py-3 bg-card/40 border border-white/5 rounded-xl backdrop-blur-sm">
            {/* Start Time */}
            <div className="flex items-center gap-1.5">
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Start</span>
                    {onMarkStart && (
                        <button 
                            onClick={onMarkStart}
                            className="flex items-center gap-1 text-[9px] text-primary hover:text-white transition-colors mt-0.5"
                            title="Set to current time (Shortcut: I)"
                        >
                            <MapPin className="w-2.5 h-2.5" />
                            Current
                        </button>
                    )}
                </div>
                <button
                    onClick={() => onStartChange(Math.max(0, startTime - 1))}
                    className="w-7 h-7 rounded-md bg-secondary/80 flex items-center justify-center hover:bg-secondary text-white transition-colors"
                >
                    <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={() => onStartChange(Math.max(0, startTime - 0.1))}
                    className="text-[9px] px-1.5 py-1 rounded bg-secondary/50 text-muted-foreground hover:text-white transition-colors"
                >
                    -0.1
                </button>
                <span className="text-sm font-mono text-white min-w-[70px] text-center font-bold bg-black/20 py-1 rounded">
                    {formatTime(startTime)}
                </span>
                <button
                    onClick={() => onStartChange(startTime + 0.1)}
                    className="text-[9px] px-1.5 py-1 rounded bg-secondary/50 text-muted-foreground hover:text-white transition-colors"
                >
                    +0.1
                </button>
                <button
                    onClick={() => onStartChange(startTime + 1)}
                    className="w-7 h-7 rounded-md bg-secondary/80 flex items-center justify-center hover:bg-secondary text-white transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="hidden sm:block h-6 w-[1px] bg-white/10 mx-2" />

            {/* End Time */}
            <div className="flex items-center gap-1.5">
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">End</span>
                    {onMarkEnd && (
                        <button 
                            onClick={onMarkEnd}
                            className="flex items-center gap-1 text-[9px] text-primary hover:text-white transition-colors mt-0.5"
                            title="Set to current time (Shortcut: O)"
                        >
                            <MapPin className="w-2.5 h-2.5" />
                            Current
                        </button>
                    )}
                </div>
                <button
                    onClick={() => onEndChange(Math.max(startTime + 0.5, endTime - 1))}
                    className="w-7 h-7 rounded-md bg-secondary/80 flex items-center justify-center hover:bg-secondary text-white transition-colors"
                >
                    <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={() => onEndChange(Math.max(startTime + 0.1, endTime - 0.1))}
                    className="text-[9px] px-1.5 py-1 rounded bg-secondary/50 text-muted-foreground hover:text-white transition-colors"
                >
                    -0.1
                </button>
                <span className="text-sm font-mono text-white min-w-[70px] text-center font-bold bg-black/20 py-1 rounded">
                    {formatTime(endTime)}
                </span>
                <button
                    onClick={() => onEndChange(endTime + 0.1)}
                    className="text-[9px] px-1.5 py-1 rounded bg-secondary/50 text-muted-foreground hover:text-white transition-colors"
                >
                    +0.1
                </button>
                <button
                    onClick={() => onEndChange(endTime + 1)}
                    className="w-7 h-7 rounded-md bg-secondary/80 flex items-center justify-center hover:bg-secondary text-white transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Duration Badge */}
            <div className="ml-auto flex flex-col items-end">
                <span className="text-[10px] text-muted-foreground font-bold mb-1">DURATION</span>
                <span className="text-[11px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold border border-primary/20">
                    {(endTime - startTime).toFixed(1)}s
                </span>
            </div>
        </div>
    );
}
