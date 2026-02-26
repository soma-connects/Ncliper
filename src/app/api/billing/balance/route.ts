import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserBalance } from '@/lib/billing/credits';

/**
 * GET /api/billing/balance
 * Returns the authenticated user's current credit balance
 */
export async function GET(_req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const balance = await getUserBalance(userId);

        return NextResponse.json({
            balance,
            userId
        });

    } catch (error) {
        console.error('[Billing API] Error fetching balance:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
