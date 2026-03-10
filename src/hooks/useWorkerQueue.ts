import { useQuery } from '@tanstack/react-query';
import { getWorkerQueue, WorkerJob } from '@/lib/admin/actions';

/**
 * Custom hook to poll the Modal Engine worker queue via Server Actions.
 * Integrates into the Admin Dashboard's DataTable.
 */
export function useWorkerQueue() {
    return useQuery<WorkerJob[], Error, WorkerJob[]>({
        queryKey: ['workerQueue'],
        queryFn: async () => {
            try {
                const data = await getWorkerQueue();
                return data;
            } catch {
                // If the Modal endpoint times out (e.g., during cold starts),
                // we gracefully return a specific error state message.
                // React Query will make this available via the `error.message` property,
                // allowing the DataTable to show "Waking up AI Workers..." rather than crashing.
                throw new Error("Waking up AI Workers...");
            }
        },
        // Poll every 5 seconds as requested
        refetchInterval: 5000,
        // Disable automatic retries so we see the "Waking up AI Workers..." state immediately
        retry: false,
    });
}
