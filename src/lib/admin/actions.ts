'use server';

import 'server-only';

export type WorkerJobStatus = 'Downloading' | 'Whisper Transcription' | 'MediaPipe Cropping' | 'Completed' | 'Failed';

export interface WorkerJob {
    id: string;
    filename: string;
    status: WorkerJobStatus;
    progress?: number;
    createdAt?: string;
}

/**
 * Server Action to fetch the current queue of jobs from the Python Modal workers.
 * Provided by the backend team. Currently a stub.
 */
export async function getWorkerQueue(): Promise<WorkerJob[]> {
    // Simulate network delay to the Modal endpoint
    await new Promise(resolve => setTimeout(resolve, 300));

    // For the sake of the UI error state demonstration, simulate an occasional timeout 
    // that would occur during a Modal cold start.
    // In production, this would be an actual fetch request to the FastAPI endpoint.
    const isColdStart = Math.random() < 0.1;
    if (isColdStart) {
        throw new Error("Modal endpoint timeout - cold start");
    }

    // Return dummy data that follows the required structure
    return [
        {
            id: 'mod-job-1',
            filename: 'defense_presentation.pdf',
            status: 'Whisper Transcription',
            progress: 55,
            createdAt: new Date(Date.now() - 120000).toISOString()
        },
        {
            id: 'mod-job-2',
            filename: 'research_footage.mp4',
            status: 'Downloading',
            progress: 10,
            createdAt: new Date(Date.now() - 30000).toISOString()
        },
        {
            id: 'mod-job-3',
            filename: 'lectures_batch_1.mp4',
            status: 'MediaPipe Cropping',
            progress: 89,
            createdAt: new Date(Date.now() - 300000).toISOString()
        }
    ];
}
