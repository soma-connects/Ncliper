'use client';

import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function SemanticSearchInput() {
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const router = useRouter();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsSearching(true);
        // Navigate to the search results page with the query
        router.push(`/dashboard/search?q=${encodeURIComponent(query)}`);
        setIsSearching(false);
    };

    return (
        <form onSubmit={handleSearch} className="w-full relative">
            {isSearching ? (
                <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
            ) : (
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            )}
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Describe a clip (e.g., 'Find the part about AI pricing')..."
                className="w-full bg-secondary/50 border border-border rounded-full pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/70"
            />
        </form>
    );
}
