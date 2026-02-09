import { NextResponse } from 'next/server';
import { checkRedisHealth, getQueueDepth } from '@/lib/queue/redis';

/**
 * GET /api/health
 * Health check endpoint for monitoring
 */
export async function GET() {
    try {
        const redisHealthy = await checkRedisHealth();
        const queueDepth = redisHealthy ? await getQueueDepth() : null;

        const health = {
            status: redisHealthy ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            services: {
                redis: redisHealthy ? 'connected' : 'disconnected',
            },
            queue: redisHealthy ? {
                depth: queueDepth,
                status: (queueDepth || 0) > 100 ? 'warning' : 'normal',
            } : null,
        };

        return NextResponse.json(health, {
            status: redisHealthy ? 200 : 503
        });

    } catch (error) {
        console.error('[Health] Check failed:', error);
        return NextResponse.json({
            status: 'unhealthy',
            error: 'Health check failed',
        }, { status: 500 });
    }
}
