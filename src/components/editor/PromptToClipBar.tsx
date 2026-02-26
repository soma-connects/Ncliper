'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Search, MapPin } from 'lucide-react';

interface PromptMatch {
    start_time: number;
    end_time: number;
    snippet: string;
    confidence: number;
}

interface PromptToClipBarProps {
    projectId: string;
    onMatchSelect: (match: PromptMatch) => void;
}

export function PromptToClipBar({ projectId, onMatchSelect }: PromptToClipBarProps) {
    const [query, setQuery] = useState('');
    const [matches, setMatches] = useState<PromptMatch[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsSearching(true);
        setError(null);
        setMatches([]);

        try {
            const res = await fetch('/api/prompt-to-clip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ project_id: projectId, query }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Search failed');
            }

            const data = await res.json();
            setMatches(data.matches || []);

            // Auto-select first match
            if (data.matches && data.matches.length > 0) {
                onMatchSelect(data.matches[0]);
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsSearching(false);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="w-full space-y-3">
            {/* Search Input */}
            <form onSubmit={handleSearch} className="relative">
                <div className="relative flex items-center">
                    <Sparkles className="absolute left-3 w-4 h-4 text-purple-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="What moment are you looking for? (e.g., 'Find where they talk about GTA 6')"
                        className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-24 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder:text-muted-foreground/60"
                    />
                    <button
                        type="submit"
                        disabled={isSearching || !query.trim()}
                        className="absolute right-2 px-4 py-1.5 bg-gradient-to-r from-purple-600 to-primary text-white text-xs font-bold rounded-lg disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center gap-1.5"
                    >
                        {isSearching ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Search className="w-3.5 h-3.5" />
                        )}
                        {isSearching ? 'Searching...' : 'Find'}
                    </button>
                </div>
            </form>

            {/* Error */}
            {error && (
                <p className="text-xs text-red-400 px-2">{error}</p>
            )}

            {/* Match Results */}
            {matches.length > 0 && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-xs text-muted-foreground px-1">
                        Found {matches.length} moment{matches.length > 1 ? 's' : ''} matching &quot;{query}&quot;
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {matches.map((match, idx) => (
                            <button
                                key={idx}
                                onClick={() => onMatchSelect(match)}
                                className="group flex items-center gap-2 px-3 py-2 bg-card/50 border border-white/5 rounded-lg hover:border-purple-500/30 hover:bg-purple-500/5 transition-all text-left"
                            >
                                <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono text-white">
                                            {formatTime(match.start_time)} — {formatTime(match.end_time)}
                                        </span>
                                        <span className="text-[10px] text-purple-400 font-bold">{match.confidence}%</span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground truncate max-w-[250px]">
                                        {match.snippet}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
