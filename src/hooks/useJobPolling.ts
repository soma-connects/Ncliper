/**
 * Custom hook for subscribing to job status via WebSockets
 * Replaces the old 3-second polling mechanism with instant Supabase Realtime updates.
 */

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Clip } from '@/lib/video/types';

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface JobData {
    id: string;
    status: JobStatus;
    created_at: string;
    updated_at: string;
    result_data?: {
        clips: Clip[];
        metadata: {
            title: string;
            duration: number;
            hooks_found: number;
        };
    };
    error?: string;
    message?: string;
}

// Ensure you have these exposed to the client in Next.js (.env.local)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function useJobPolling(jobId: string | null) {
    const [status, setStatus] = useState<JobStatus | null>(null);
    const [data, setData] = useState<JobData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPolling, setIsPolling] = useState(false);

    useEffect(() => {
        if (!jobId) {
            setStatus(null);
            setData(null);
            setError(null);
            setIsPolling(false);
            return;
        }

        setIsPolling(true);
        let isMounted = true;

        // 1. Fetch initial state immediately
        const fetchInitialState = async () => {
            try {
                const res = await fetch(`/api/jobs/${jobId}`);
                if (!res.ok) throw new Error(`Failed to fetch job status: ${res.status}`);
                const result: JobData = await res.json();

                if (!isMounted) return;
                setStatus(result.status);
                setData(result);

                if (result.status === 'failed') setError(result.error || 'Job failed');
                if (result.status === 'completed' || result.status === 'failed') {
                    setIsPolling(false);
                }
            } catch (err: unknown) {
                if (isMounted) setError(err instanceof Error ? err.message : 'Initial fetch failed');
            }
        };

        fetchInitialState();

        // 2. Subscribe to Supabase Realtime for instant updates
        const channel = supabase
            .channel(`job-${jobId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'jobs',
                    filter: `id=eq.${jobId}`
                },
                (payload) => {
                    const result = payload.new as JobData;
                    if (!isMounted) return;

                    console.log("[Realtime] Status update:", result.status, result.message);
                    setStatus(result.status);
                    setData(result);

                    if (result.status === 'failed') {
                        setError(result.error || 'Job failed');
                        setIsPolling(false);
                    } else if (result.status === 'completed') {
                        setIsPolling(false);

                        // Attempt browser notification
                        if ('Notification' in window && Notification.permission === 'granted') {
                            new Notification('Ncliper: Video Ready!', {
                                body: 'Your viral clips have been successfully generated.',
                                icon: '/favicon.ico'
                            });
                        }
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`[Realtime] Subscribed to job ${jobId}`);
                }
            });

        // Cleanup
        return () => {
            isMounted = false;
            supabase.removeChannel(channel);
        };
    }, [jobId]);

    // Request notification permission on first mount if not asked
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    return { status, data, error, isPolling };
}
