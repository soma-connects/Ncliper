'use client';

import { useState } from 'react';
import { Search, Loader2, Play } from 'lucide-react';
import { Clip } from '@/lib/video/types';
import { useAuth } from '@clerk/nextjs';

export function GlobalSearchBar() {
    const { getToken } = useAuth();
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<Clip[] | null>(null);
    const [error, setError] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsSearching(true);
        setError('');
        setResults(null);

        try {
            const res = await fetch('/api/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: query.trim(), limit: 6, threshold: 0.3 })
            });

            if (!res.ok) {
                throw new Error('Search failed');
            }

            const data = await res.json();
            setResults(data.clips || []);
        } catch (err: any) {
            console.error(err);
            setError('Failed to search clips. Please try again.');
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto px-4 mb-12">
            <form onSubmit={handleSearch} className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Describe a moment to find it globally... (e.g. 'Talking about the iPhone camera')"
                    className="w-full bg-card/50 border border-border rounded-xl py-4 pl-12 pr-12 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {isSearching ? (
                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    ) : (
                        <button
                            type="submit"
                            disabled={!query.trim()}
                            className="bg-primary/20 hover:bg-primary/30 text-primary p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Search className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </form>

            {error && (
                <div className="mt-4 text-center text-red-400 text-sm">{error}</div>
            )}

            {results !== null && (
                <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-muted-foreground">
                            {results.length > 0 ? `Found ${results.length} semantic matches` : 'No matches found'}
                        </h3>
                        <button
                            onClick={() => setResults(null)}
                            className="text-xs text-muted-foreground hover:text-white"
                        >
                            Clear Results
                        </button>
                    </div>

                    {results.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {results.map((clip) => (
                                <div key={clip.id} className="bg-card border border-border rounded-xl overflow-hidden group">
                                    <div className="relative aspect-video bg-black">
                                        {/* Simple video preview */}
                                        <video
                                            src={clip.url}
                                            className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                                            controls
                                            preload="metadata"
                                        />
                                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-xs font-mono text-green-400 border border-white/10 shadow-sm">
                                            {clip.similarity ? Math.round(clip.similarity * 100) : Math.round(clip.score)}% Match
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h4 className="text-sm font-semibold text-white line-clamp-2 mb-2" title={clip.title}>
                                            {clip.title}
                                        </h4>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span className="bg-secondary px-2 py-1 rounded-md">
                                                {clip.duration}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
