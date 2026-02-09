import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/server';
import { Database } from '@/lib/supabase/types';

type CreditLedgerInsert = Database['public']['Tables']['credit_ledger']['Insert'];

/**
 * Get user's current credit balance
 */
export async function getCreditBalance(userId: string): Promise<number> {
    try {
        // Use the database function for efficient aggregation
        const { data, error } = await supabaseAdmin
            .rpc('get_credit_balance', { p_user_id: userId });

        if (error) {
            console.error('[Credits] Failed to get balance:', error);
            return 0;
        }

        return data || 0;
    } catch (error) {
        console.error('[Credits] Balance check error:', error);
        return 0;
    }
}

/**
 * Deduct credits for video processing
 * Returns true if successful, false if insufficient balance
 */
export async function deductCredits(
    userId: string,
    amount: number,
    jobId: string,
    description?: string
): Promise<boolean> {
    try {
        const balance = await getCreditBalance(userId);

        if (balance < amount) {
            console.warn(`[Credits] Insufficient balance for user ${userId}: ${balance} < ${amount}`);
            return false;
        }

        const ledgerEntry: CreditLedgerInsert = {
            user_id: userId,
            amount: -amount, // Negative for deduction
            transaction_type: 'USAGE',
            description: description || `Video processing (${amount} credits)`,
            related_job_id: jobId,
        };

        const { error } = await supabaseAdmin
            .from('credit_ledger')
            .insert(ledgerEntry);

        if (error) {
            console.error('[Credits] Failed to deduct credits:', error);
            return false;
        }

        console.log(`[Credits] Deducted ${amount} credits from user ${userId}`);
        return true;

    } catch (error) {
        console.error('[Credits] Deduction error:', error);
        return false;
    }
}

/**
 * Grant credits (for purchases, subscriptions, bonuses)
 */
export async function grantCredits(
    userId: string,
    amount: number,
    transactionType: 'PURCHASE' | 'SUBSCRIPTION_GRANT' | 'BONUS',
    description?: string
): Promise<boolean> {
    try {
        const ledgerEntry: CreditLedgerInsert = {
            user_id: userId,
            amount: amount, // Positive for grant
            transaction_type: transactionType,
            description: description || `Credit grant (${amount} credits)`,
        };

        const { error } = await supabaseAdmin
            .from('credit_ledger')
            .insert(ledgerEntry);

        if (error) {
            console.error('[Credits] Failed to grant credits:', error);
            return false;
        }

        console.log(`[Credits] Granted ${amount} credits to user ${userId}`);
        return true;

    } catch (error) {
        console.error('[Credits] Grant error:', error);
        return false;
    }
}

/**
 * Calculate video processing cost in credits
 * Blueprint: 1 credit = 1 minute of video
 */
export function calculateVideoCost(durationMinutes: number): number {
    return Math.ceil(durationMinutes);
}

/**
 * Get user's credit transaction history
 */
export async function getCreditHistory(
    userId: string,
    limit: number = 50
) {
    try {
        const { data, error } = await supabaseAdmin
            .from('credit_ledger')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('[Credits] Failed to get history:', error);
            return [];
        }

        return data || [];

    } catch (error) {
        console.error('[Credits] History error:', error);
        return [];
    }
}
