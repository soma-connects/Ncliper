/**
 * Custom hook for polling job status
 * Polls /api/jobs/[id] every 3 seconds until completion or failure
 */

import { useState, useEffect } from 'react';

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface JobData {
    id: string;
    status: JobStatus;
    created_at: string;
    updated_at: string;
    result_data?: {
        clips: any[];
        metadata: {
            title: string;
            duration: number;
            hooks_found: number;
        };
    };
    error?: string;
}

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
            return;
        }

        setIsPolling(true);
        let isMounted = true;
        let pollCount = 0;
        const maxPolls = 120; // Max 6 minutes (120 * 3s)

        const pollStatus = async () => {
            try {
                const res = await fetch(`/api/jobs/${jobId}`);

                if (!res.ok) {
                    throw new Error(`Failed to fetch job status: ${res.status}`);
                }

                const result: JobData = await res.json();

                if (!isMounted) return;

                setStatus(result.status);
                setData(result);

                // Stop polling on completion or failure
                if (result.status === 'completed' || result.status === 'failed') {
                    setIsPolling(false);
                    if (result.status === 'failed') {
                        setError(result.error || 'Job failed');
                    }
                    return true; // Signal to stop polling
                }

                return false; // Continue polling
            } catch (err: any) {
                if (!isMounted) return true;

                console.error('[JobPolling] Error:', err);
                setError(err.message || 'Failed to poll job status');
                setIsPolling(false);
                return true; // Stop on error
            }
        };

        // Initial poll
        pollStatus();

        // Set up polling interval
        const interval = setInterval(async () => {
            pollCount++;

            // Safety: Stop after max polls
            if (pollCount >= maxPolls) {
                console.warn('[JobPolling] Max polls reached, stopping');
                setError('Job timed out - please check status manually');
                setIsPolling(false);
                clearInterval(interval);
                return;
            }

            const shouldStop = await pollStatus();
            if (shouldStop) {
                clearInterval(interval);
            }
        }, 3000); // Poll every 3 seconds

        // Cleanup
        return () => {
            isMounted = false;
            clearInterval(interval);
            setIsPolling(false);
        };
    }, [jobId]);

    return { status, data, error, isPolling };
}
