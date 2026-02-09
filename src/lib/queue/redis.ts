import 'server-only';
import { Redis } from '@upstash/redis';

// Initialize Redis client (works serverless with Upstash)
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Queue names following the blueprint architecture
export const QUEUE_NAMES = {
    PROCESSING: 'jobs:processing',
    COMPLETED: 'jobs:completed',
    DEAD_LETTER: 'jobs:dead_letter',
} as const;

// Job status enum
export const JOB_STATUS = {
    QUEUED: 'queued',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
} as const;

export type JobStatus = typeof JOB_STATUS[keyof typeof JOB_STATUS];

// Job payload interface
export interface VideoJob {
    id: string;
    user_id: string;
    video_url: string;
    settings?: {
        clip_count?: number;
        duration_range?: [number, number];
        aspect_ratio?: '9:16' | '16:9' | '1:1';
    };
    created_at: string;
    retry_count?: number;
}

/**
 * Push a video processing job to the queue
 * Returns job ID for tracking
 */
export async function enqueueVideoJob(job: VideoJob): Promise<string> {
    try {
        // Add to processing queue
        await redis.lpush(QUEUE_NAMES.PROCESSING, JSON.stringify(job));

        console.log(`[Queue] Enqueued job ${job.id} for user ${job.user_id}`);
        return job.id;
    } catch (error) {
        console.error('[Queue] Failed to enqueue job:', error);
        throw new Error('Failed to queue video processing job');
    }
}

/**
 * Move job to dead letter queue after max retries
 */
export async function moveToDeadLetter(job: VideoJob, error: string): Promise<void> {
    const deadLetterJob = {
        ...job,
        error,
        failed_at: new Date().toISOString(),
    };

    await redis.lpush(QUEUE_NAMES.DEAD_LETTER, JSON.stringify(deadLetterJob));
    console.error(`[Queue] Moved job ${job.id} to dead letter queue: ${error}`);
}

/**
 * Get approximate queue depth (for monitoring/autoscaling)
 */
export async function getQueueDepth(): Promise<number> {
    try {
        const depth = await redis.llen(QUEUE_NAMES.PROCESSING);
        return depth || 0;
    } catch (error) {
        console.error('[Queue] Failed to get queue depth:', error);
        return 0;
    }
}

/**
 * Health check for Redis connection
 */
export async function checkRedisHealth(): Promise<boolean> {
    try {
        await redis.ping();
        return true;
    } catch (error) {
        console.error('[Queue] Redis health check failed:', error);
        return false;
    }
}

export default redis;
