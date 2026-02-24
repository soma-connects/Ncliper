import { supabaseAdmin as supabase } from '@/lib/supabase/server';

/**
 * Retrieves the user's current exact credit balance by summing the ledger.
 */
export async function getUserBalance(userId: string): Promise<number> {
    try {
        if (!userId) return 0;

        const { data, error } = await (supabase.rpc as any)('get_user_balance', {
            user_uid: userId
        });

        if (error) {
            console.error('[Billing] Failed to fetch balance:', error);
            return 0;
        }

        return data || 0;
    } catch (error) {
        console.error('[Billing] Exception fetching balance:', error);
        return 0;
    }
}

/**
 * Grants credits to a user (positive integer).
 * Types could be: 'signup_bonus', 'stripe_purchase', 'admin_grant'
 */
export async function grantCredits(
    userId: string,
    amount: number,
    transactionType: string,
    description: string,
    metadata: Record<string, any> = {}
): Promise<boolean> {
    try {
        if (amount <= 0) {
            console.warn('[Billing] Grant amount must be positive.');
            return false;
        }

        const { error } = await supabase
            .from('credit_ledger')
            .insert({
                user_id: userId,
                amount: Math.floor(amount), // Ensure integer
                transaction_type: transactionType,
                description: description,
                metadata: metadata
            } as any);

        if (error) {
            console.error('[Billing] Failed to grant credits:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('[Billing] Exception granting credits:', error);
        return false;
    }
}

/**
 * Deducts credits from a user (negative integer).
 * Fails if user does not have sufficient balance, unless force=true.
 */
export async function deductCredits(
    userId: string,
    amount: number,
    transactionType: string,
    description: string,
    jobId?: string,
    force: boolean = false
): Promise<{ success: boolean; remaining?: number; error?: string }> {
    try {
        // Enforce positive input so we negate it correctly
        const deduction = Math.abs(Math.floor(amount));

        if (!force) {
            const currentBalance = await getUserBalance(userId);
            if (currentBalance < deduction) {
                return {
                    success: false,
                    error: `Insufficient credits. Required: ${deduction}, Available: ${currentBalance}`
                };
            }
        }

        const { error } = await supabase
            .from('credit_ledger')
            .insert({
                user_id: userId,
                amount: -deduction, // Negative for deductuion
                transaction_type: transactionType,
                description: description,
                related_job_id: jobId || null
            } as any);

        if (error) {
            console.error('[Billing] Failed to deduct credits:', error);
            return { success: false, error: 'Database error' };
        }

        // Return the new predicted balance for UI convenience
        const newBalance = await getUserBalance(userId);
        return { success: true, remaining: newBalance };

    } catch (error) {
        console.error('[Billing] Exception deducting credits:', error);
        return { success: false, error: 'Internal server error' };
    }
}
