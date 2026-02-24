'use client';

import { useState, useEffect } from 'react';
import { Coins } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';

export function CreditsBadge() {
    const { userId } = useAuth();
    const [balance, setBalance] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;

        const fetchBalance = async () => {
            try {
                const res = await fetch('/api/billing/balance');
                if (res.ok) {
                    const data = await res.json();
                    setBalance(data.balance);
                }
            } catch (error) {
                console.error('Failed to fetch balance', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBalance();

        // Polling for balance updates (every 30 seconds)
        const interval = setInterval(fetchBalance, 30000);
        return () => clearInterval(interval);
    }, [userId]);

    if (!userId) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-card/10 border border-border/20 rounded-full text-sm font-medium text-muted-foreground/50 cursor-not-allowed">
                <Coins className="w-4 h-4" />
                <span>--</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-card/50 border border-border/50 rounded-full text-sm font-medium text-white shadow-sm hover:bg-card/80 transition-colors cursor-pointer group">
            <Coins className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            {isLoading ? (
                <div className="w-6 h-4 bg-muted/50 rounded animate-pulse" />
            ) : (
                <span className="tabular-nums">
                    {balance ?? 0}
                </span>
            )}
            <span className="text-muted-foreground text-xs hidden sm:inline-block ml-1">
                credits
            </span>
        </div>
    );
}
