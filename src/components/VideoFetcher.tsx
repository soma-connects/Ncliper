'use client';

import { useState } from 'react';
import { getVideoTitle, getViralHooks } from '../lib/video/actions';
import ClipCard from './ClipCard';

interface ViralHook {
    start_time: number;
    end_time: number;
    segments?: { start: number; end: number }[];
    virality_score: number;
    type: string;
}

export default function VideoFetcher() {
    const [url, setUrl] = useState('');
    const [title, setTitle] = useState<string | null>(null);
    const [hooks, setHooks] = useState<ViralHook[]>([]);
    // New state for transcript
    const [transcript, setTranscript] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);

    const handleFetch = async () => {
        if (!url) return;

        setLoading(true);
        setAnalyzing(true);
        setError(null);
        setTitle(null);
        setHooks([]);
        setTranscript("");

        try {
            // 1. Get Title
            const titleRes = await getVideoTitle(url);
            if (titleRes.error) {
                setError(titleRes.error);
                setLoading(false);
                setAnalyzing(false);
                return;
            }
            setTitle(titleRes.title || "Unknown Title");

            // 2. Analyze for Hooks
            const hooksRes = await getViralHooks(url);
            if (hooksRes.error) {
                console.warn(hooksRes.error);
            } else if (hooksRes.hooks) {
                setHooks(hooksRes.hooks);
                // 2b. Store transcript
                if (hooksRes.transcript) {
                    setTranscript(hooksRes.transcript);
                }
            }

        } catch (_err) {
            setError("An unexpected error occurred.");
        } finally {
            setLoading(false);
            setAnalyzing(false);
        }
    };

    const [clipStates, setClipStates] = useState<Record<number, { status: 'idle' | 'processing' | 'completed', progress: number, downloadUrl: string }>>({});

    const handleGenerate = async (index: number, segments: { start: number; end: number }[]) => {
        setClipStates(prev => ({
            ...prev,
            [index]: { status: 'processing', progress: 0, downloadUrl: '' }
        }));

        // Simulate progress since we can't stream it easily yet from server action
        const progressInterval = setInterval(() => {
            setClipStates(prev => {
                const current = prev[index]?.progress || 0;
                if (current >= 90) return prev; // Hold at 90% until done
                return {
                    ...prev,
                    [index]: { ...prev[index], progress: current + 10 }
                };
            });
        }, 500);

        try {
            const { generateClip } = await import('../lib/video/actions');
            const res = await generateClip(url, segments);

            clearInterval(progressInterval);

            if (res.path) {
                setClipStates(prev => ({
                    ...prev,
                    [index]: { status: 'completed', progress: 100, downloadUrl: res.path }
                }));
            } else {
                alert("Failed: " + res.error);
                setClipStates(prev => ({
                    ...prev,
                    [index]: { ...prev[index], status: 'idle', progress: 0 }
                }));
            }
        } catch (err) {
            clearInterval(progressInterval);
            console.error(err);
            setClipStates(prev => ({
                ...prev,
                [index]: { ...prev[index], status: 'idle', progress: 0 }
            }));
        }
    };

    return (
        <div className="w-full max-w-4xl flex flex-col items-center gap-8">
            <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md space-y-4 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Video Analyzer</h2>
                <div className="flex flex-col gap-2">
                    <input
                        type="text"
                        placeholder="Enter Video URL"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                    <button
                        onClick={handleFetch}
                        disabled={loading || !url}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {title ? "Analyzing Hooks..." : "Processing..."}
                            </span>
                        ) : (
                            "Analyze Video"
                        )}
                    </button>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded text-sm">
                        {error}
                    </div>
                )}

                {title && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded">
                        <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">Video Title</p>
                        <p className="font-medium line-clamp-2">{title}</p>
                    </div>
                )}
            </div>

            {hooks.length > 0 && (
                <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Viral Suggestions</h3>
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold">
                            {hooks.length}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {hooks.map((hook, idx) => {
                            const state = clipStates[idx] || { status: 'idle', progress: 0, downloadUrl: '' };
                            const segments = hook.segments || [{ start: hook.start_time, end: hook.end_time }];

                            // Rough estimation of segment text:
                            // We don't have exact word-level timestamps in the bulk transcript easily unless we re-parse.
                            // Better: slice the transcript roughly by ratio or just pass the whole thing and let Metadata Generator trim/analyze?
                            // Actually, Metadata Gen takes the *clip* transcript.
                            // Passing the WHOLE transcript is overkill but simple. Metadata Gen prompts can handle "Analyze this transcript...".
                            // Ideally we slice it.
                            // For MVP, passing full transcript is fine, or we can slice it if we had word offsets.
                            // Let's passed full transcript for context.

                            return (
                                <ClipCard
                                    key={idx}
                                    startTime={hook.start_time}
                                    endTime={hook.end_time}
                                    score={hook.virality_score}
                                    type={hook.type}
                                    videoUrl={url}
                                    transcriptSegment={transcript} // Passing full transcript for now
                                    status={state.status}
                                    progress={state.progress}
                                    downloadUrl={state.downloadUrl}
                                    onGenerate={() => handleGenerate(idx, segments)}
                                    onDownload={() => window.open(state.downloadUrl, '_blank')}
                                />
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
