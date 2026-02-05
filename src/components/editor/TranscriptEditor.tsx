import { TranscriptSegment } from "@/lib/video/types";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface TranscriptEditorProps {
    transcript?: TranscriptSegment[];
}

export function TranscriptEditor({ transcript: initialTranscript = [] }: TranscriptEditorProps) {
    const [transcript, setTranscript] = useState<TranscriptSegment[]>(initialTranscript);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [currentTime, setCurrentTime] = useState(0); // This would be synced with player in a real app

    useEffect(() => {
        setTranscript(initialTranscript);
    }, [initialTranscript]);

    const handleTextChange = (index: number, newText: string) => {
        const newTranscript = [...transcript];
        newTranscript[index].text = newText;
        setTranscript(newTranscript);
    };

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            setEditingIndex(null);
        }
    };

    return (
        <div className="w-80 h-full bg-card/20 border-l border-border flex flex-col backdrop-blur-md">
            <div className="p-4 border-b border-white/5 bg-card/50 backdrop-blur-sm flex items-center justify-between">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                    Captions
                </h3>
                <span className="text-[10px] font-mono text-muted-foreground/50">
                    {transcript.length} SEGMENTS
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {transcript.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 space-y-2">
                        <p className="font-medium text-sm">No Captions Selected</p>
                        <p className="text-xs">Select a clip to edit captions</p>
                    </div>
                ) : (
                    <div className="space-y-3 relative">
                        {/* Connecting Line */}
                        <div className="absolute left-[2.35rem] top-2 bottom-2 w-px bg-white/5" />

                        <AnimatePresence>
                            {transcript.map((segment, i) => {
                                // Mock active state based on time (in real app, this composes with player time)
                                const isActive = i === 1; // Just for visual demo

                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className={cn(
                                            "relative group pl-12 pr-2 py-2 rounded-lg transition-all duration-200 border border-transparent",
                                            isActive ? "bg-primary/10 border-primary/20" : "hover:bg-white/5 hover:border-white/10"
                                        )}
                                    >
                                        {/* Timestamp Bubble */}
                                        <div className={cn(
                                            "absolute left-2 top-2.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold z-10 transition-colors",
                                            isActive
                                                ? "bg-primary text-white shadow-lg shadow-primary/20"
                                                : "bg-secondary text-muted-foreground group-hover:bg-white/20 group-hover:text-white"
                                        )}>
                                            {segment.timestamp}
                                        </div>

                                        {/* Editable Text */}
                                        {editingIndex === i ? (
                                            <textarea
                                                autoFocus
                                                value={segment.text}
                                                onChange={(e) => handleTextChange(i, e.target.value)}
                                                onBlur={() => setEditingIndex(null)}
                                                onKeyDown={(e) => handleKeyDown(e, i)}
                                                className="w-full bg-black/40 text-white rounded p-2 text-sm outline-none border border-primary/50 min-h-[60px] resize-none leading-relaxed"
                                            />
                                        ) : (
                                            <p
                                                onClick={() => setEditingIndex(i)}
                                                className={cn(
                                                    "text-sm leading-relaxed cursor-text transition-colors",
                                                    isActive ? "text-white font-medium" : "text-muted-foreground group-hover:text-gray-300"
                                                )}
                                            >
                                                {segment.text}
                                            </p>
                                        )}

                                        {/* Edit Hint */}
                                        {editingIndex !== i && (
                                            <span className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-[10px] text-muted-foreground pointer-events-none transition-opacity">
                                                Click to edit
                                            </span>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-white/5 bg-card/50">
                <button className="w-full text-xs font-semibold bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white py-3 rounded-lg transition-colors border border-white/5">
                    Reset Changes
                </button>
            </div>
        </div>
    );
}
