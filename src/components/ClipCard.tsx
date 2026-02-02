'use client';

import { useState } from 'react';
import { generateMetadataAction, generateThumbnailFrameAction, generateAIThumbnailAction } from '@/lib/video/actions';

export type ClipStatus = 'idle' | 'processing' | 'completed';

interface ClipCardProps {
    startTime: number;
    endTime: number;
    score: number;
    type: string;
    videoUrl: string; // Added videoUrl for frame extraction
    transcriptSegment: string; // Added for metadata generation
    status?: ClipStatus;
    progress?: number;
    downloadUrl?: string;
    onGenerate?: () => void;
    onDownload?: () => void;
}

export default function ClipCard({
    startTime,
    endTime,
    score,
    type,
    videoUrl,
    transcriptSegment,
    status = 'idle',
    progress = 0,
    downloadUrl,
    onGenerate,
    onDownload
}: ClipCardProps) {
    const [isMetadataLoading, setIsMetadataLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [thumbnailPrompt, setThumbnailPrompt] = useState('');
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
    const [isThumbnailLoading, setIsThumbnailLoading] = useState(false);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
        if (score >= 70) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400';
        return 'text-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-400';
    };

    const handleGenerateMetadata = async () => {
        setIsMetadataLoading(true);
        const res = await generateMetadataAction(transcriptSegment || "No transcript provided.");
        if (res.metadata) {
            setTitle(res.metadata.title);
            setThumbnailPrompt(res.metadata.thumbnail_prompt);
        }
        setIsMetadataLoading(false);
    };

    const handleExtractFrame = async () => {
        setIsThumbnailLoading(true);
        const res = await generateThumbnailFrameAction(videoUrl, startTime);
        if (res.path) setThumbnailUrl(res.path);
        setIsThumbnailLoading(false);
    };

    const handleGenerateAIThumbnail = async () => {
        setIsThumbnailLoading(true);
        const res = await generateAIThumbnailAction(thumbnailPrompt);
        // Note: AI integration pending final verification of return type
        if (res.error) {
            alert("AI Generation: " + res.error);
        } else if (res.result) {
            // Placeholder: Assume res.result might be url or base64 
            // Ideally we handle the exact format here.
        }
        setIsThumbnailLoading(false);
    };

    return (
        <div className="flex flex-col p-5 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 hover:shadow-xl transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${getScoreColor(score)}`}>
                    Score: {score}
                </span>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {type}
                </span>
            </div>

            <div className="flex-1 mb-4">
                <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-1">
                    {formatTime(startTime)} <span className="text-gray-300 dark:text-gray-700 font-light mx-1">-</span> {formatTime(endTime)}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    Duration: {Math.round(endTime - startTime)}s
                </p>
            </div>

            {/* Metadata Section */}
            <div className="mb-4 space-y-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                {!title ? (
                    <button
                        onClick={handleGenerateMetadata}
                        disabled={isMetadataLoading}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-500 disabled:opacity-50"
                    >
                        {isMetadataLoading ? 'Analyzing...' : '✨ Generate Title & Thumbnail Idea'}
                    </button>
                ) : (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase">Title</label>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full text-sm font-bold bg-transparent border-b border-gray-200 dark:border-gray-700 focus:border-blue-500 outline-none py-1"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase">Thumb Prompt</label>
                            <textarea
                                value={thumbnailPrompt}
                                onChange={(e) => setThumbnailPrompt(e.target.value)}
                                className="w-full text-xs bg-transparent border border-gray-200 dark:border-gray-700 rounded p-1 h-16 resize-none"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleExtractFrame}
                                disabled={isThumbnailLoading}
                                className="flex-1 text-xs py-1.5 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                📸 Extract Frame
                            </button>
                            <button
                                onClick={handleGenerateAIThumbnail}
                                disabled={isThumbnailLoading || !thumbnailPrompt}
                                className="flex-1 text-xs py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                🎨 AI Generate
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Thumbnail Preview */}
            {thumbnailUrl && (
                <div className="mb-4 relative aspect-video rounded-lg overflow-hidden bg-black group-thumb">
                    <img src={thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-thumb-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <a href={thumbnailUrl} download className="text-white text-xs font-bold border border-white px-3 py-1 rounded-full hover:bg-white hover:text-black transition-colors">
                            Download Image
                        </a>
                    </div>
                </div>
            )}

            <div className="pt-4 border-t border-gray-50 dark:border-gray-800">
                {status === 'idle' && (
                    <button
                        onClick={onGenerate}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors group-hover:scale-[1.02] active:scale-95"
                    >
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                        </svg>
                        Generate Clip
                    </button>
                )}

                {status === 'processing' && (
                    <div className="w-full py-2.5 flex flex-col items-center justify-center gap-2">
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium animate-pulse">
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Cutting Video... {progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {status === 'completed' && (
                    <button
                        onClick={onDownload}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-all shadow-green-glow hover:scale-[1.02] active:scale-95"
                    >
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                        </svg>
                        Download Clip
                    </button>
                )}
            </div>
        </div>
    );
}
