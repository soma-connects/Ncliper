'use client';

import { useState } from 'react';
import { Youtube, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getVideoTitle, getViralHooks } from '@/lib/video/actions';
import { Clip } from '@/lib/video/types';

interface VideoInputSectionProps {
    onVideoFound: (url: string, title: string, clips: Clip[]) => void;
    isLoading?: boolean;
}

export function VideoInputSection({ onVideoFound, isLoading = false }: VideoInputSectionProps) {
    const [url, setUrl] = useState('');
    const [localLoading, setLocalLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string>("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;

        setLocalLoading(true);
        setError(null);
        setStatusMessage("Fetching video metadata...");

        try {
            // Basic validation
            if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
                throw new Error("Please enter a valid YouTube URL");
            }

            // 1. Get Title (Fast)
            const titleResult = await getVideoTitle(url);
            if (titleResult.error) throw new Error(titleResult.error);

            setStatusMessage("Analyzing transcript for viral hooks...");

            // 2. Get Viral Hooks (Slow)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const hooksResult = await getViralHooks(url) as any; // Cast to avoid build type issues for now if actions.ts types aren't fully inferred yet
            if (hooksResult.error) throw new Error(hooksResult.error);

            if (titleResult.title && hooksResult.clips) {
                setStatusMessage("Finalizing...");
                onVideoFound(url, titleResult.title, hooksResult.clips);
                setLocalLoading(false);
            } else {
                throw new Error("Could not analyze video");
            }

        } catch (err: any) {
            setError(err.message || "Something went wrong");
            setLocalLoading(false);
            setStatusMessage("");
        }
    };

    const isBusy = localLoading || isLoading;

    return (
        <div className="w-full max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" />
                    <span>AI-Powered Virality</span>
                </div>
                <h2 className="text-5xl font-bold tracking-tight text-white">
                    Turn Long Videos into <br />
                    <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">Viral Shorts Instantly</span>
                </h2>
                <p className="text-muted-foreground text-lg max-w-lg mx-auto">
                    Paste a YouTube link and let our AI agents find the hooks, add captions, and reframe for TikTok & Reels.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />

                <div className="relative flex items-center bg-card border border-border rounded-2xl p-2 shadow-2xl">
                    <div className="pl-4 pr-3 text-muted-foreground">
                        <Youtube className="w-6 h-6" />
                    </div>
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Paste YouTube Link (e.g. https://youtube.com/watch?v=...)"
                        className="flex-1 bg-transparent border-none text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-0 text-lg py-2"
                        disabled={isBusy}
                    />
                    <button
                        type="submit"
                        disabled={isBusy || !url}
                        className={cn(
                            "h-12 px-6 rounded-xl font-semibold text-white shadow-lg transition-all flex items-center gap-2",
                            isBusy
                                ? "bg-muted cursor-not-allowed"
                                : "bg-primary hover:bg-primary/90 hover:shadow-primary/25 active:scale-95"
                        )}
                    >
                        {isBusy ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>{statusMessage || 'Analyzing...'}</span>
                            </>
                        ) : (
                            <>
                                <span>Get Clips</span>
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </div>
            </form>

            {error && (
                <div className="text-center text-red-500 bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-sm animate-in fade-in zoom-in-95">
                    {error}
                </div>
            )}

            <div className="flex justify-center gap-8 text-sm text-muted-foreground pt-4">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span>Auto-Captions</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    <span>Face Tracking</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>Viral Hooks</span>
                </div>
            </div>
        </div>
    );
}
