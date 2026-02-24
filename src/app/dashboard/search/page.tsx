'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ClipCard from '@/components/ClipCard';
import { Loader2, AlertCircle } from 'lucide-react';

interface SearchResultClip {
    id: string;
    clip_id: string;
    project_id: string;
    clip_title: string;
    video_url: string;
    transcript_text: string;
    similarity: number;
}

export default function SearchResultsPage() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';

    const [results, setResults] = useState<SearchResultClip[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!query) return;

        const fetchResults = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch('/api/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query, limit: 12, threshold: 0.3 })
                });

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || 'Failed to fetch search results');
                }

                const data = await response.json();
                setResults(data.clips || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchResults();
    }, [query]);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-2">Search Results</h1>
            <p className="text-muted-foreground mb-8">
                Showing semantic matches for: <span className="text-white font-medium">"{query}"</span>
            </p>

            {isLoading && (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-muted-foreground">Analyzing semantic meaning and scanning clips...</p>
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3 text-red-400 mb-8">
                    <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            {!isLoading && !error && results.length === 0 && query && (
                <div className="text-center py-20 border border-dashed border-border rounded-xl bg-card/10">
                    <p className="text-lg text-muted-foreground">No matches found for "{query}".</p>
                    <p className="text-sm text-muted-foreground/70 mt-2">Try describing the clip differently.</p>
                </div>
            )}

            {!isLoading && results.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {results.map((match) => {
                        // We map the database row back to ClipCard props
                        // Since we don't have start/end strictly in the match signature, we mock it or default to 0
                        // (Ideally we would join with clips table to get full metadata, but match_clips RPC does some of this)
                        return (
                            <ClipCard
                                key={match.id}
                                startTime={0} // Default since we rely on actual clip for playback
                                endTime={0}
                                score={Math.round(match.similarity * 100)} // Fake virality score using similarity
                                type={"SearchResult"}
                                videoUrl={match.video_url}
                                transcriptSegment={match.transcript_text}
                                status={'completed'}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}
