import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Parse .env.local manually (no dotenv dependency needed)
const envPath = resolve(process.cwd(), '.env.local');
const envVars = Object.fromEntries(
    readFileSync(envPath, 'utf-8')
        .split('\n')
        .filter(line => line && !line.startsWith('#') && line.includes('='))
        .map(line => {
            const [key, ...rest] = line.split('=');
            return [key.trim(), rest.join('=').trim().replace(/^"(.*)"$/, '$1')];
        })
);

const supabase = createClient(
    envVars.NEXT_PUBLIC_SUPABASE_URL,
    envVars.SUPABASE_SERVICE_ROLE_KEY
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
        console.error('Failed:', error.message);
        process.exit(1);
    }

    // Verify it worked
    const { data } = await supabase
        .from('credit_ledger')
        .select('amount')
        .eq('user_id', userId);

    const total = (data || []).reduce((sum, r) => sum + r.amount, 0);
    console.log(`Done! User ${userId} now has ${total} total credits.`);
}

const userId = process.argv[2];
if (!userId) {
    console.error('Usage: node --experimental-vm-modules scripts/grant-credits.mjs <userId>');
    console.error('Example: node scripts/grant-credits.mjs user_2abc123xyz');
    process.exit(1);
}

grantCredits(userId);
