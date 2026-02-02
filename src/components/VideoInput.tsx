'use client';

import { useState } from 'react';

export default function VideoInput() {
    const [url, setUrl] = useState('');

    const handleProcess = () => {
        console.log('Processing URL:', url);
        // TODO: Implement processing logic
    };

    return (
        <div className="w-full max-w-lg space-y-4 rounded-xl bg-zinc-900/50 p-6 backdrop-blur-sm border border-zinc-800">
            <div className="space-y-2">
                <label htmlFor="video-url" className="text-sm font-medium text-zinc-400">
                    YouTube URL
                </label>
                <div className="flex gap-2">
                    <input
                        id="video-url"
                        type="text"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="flex-1 rounded-lg bg-zinc-950 border border-zinc-800 px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <button
                        onClick={handleProcess}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
                    >
                        Process
                    </button>
                </div>
            </div>
        </div>
    );
}
