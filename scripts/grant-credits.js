/**
 * One-time script to manually grant signup credits to an existing user.
 * Run: node scripts/grant-credits.js <userId>
 *
 * Get your userId from Clerk Dashboard → Users → click your user → copy the ID (starts with user_)
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function grantCredits(userId, amount = 60) {
    console.log(`Granting ${amount} credits to user: ${userId}`);

    const { error } = await supabase
        .from('credit_ledger')
        .insert({
            user_id: userId,
            amount: amount,
            transaction_type: 'signup_bonus',
            description: 'Manual signup bonus — welcome to Ncliper!',
            metadata: { source: 'admin_script' }
        });

    if (error) {
        console.error('❌ Failed:', error.message);
        process.exit(1);
    }

    console.log(`✅ Done! User ${userId} now has ${amount} credits.`);
}

const userId = process.argv[2];
if (!userId) {
    console.error('Usage: node scripts/grant-credits.js <userId>');
    console.error('Example: node scripts/grant-credits.js user_2abc123xyz');
    process.exit(1);
}

grantCredits(userId);
