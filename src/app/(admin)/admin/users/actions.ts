"use server"

import { createClerkClient } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase/server';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export async function getAdminUsersList() {
    try {
        // Fetch all users from Clerk (limited to 100 for MVP dashboard)
        const { data: users } = await clerkClient.users.getUserList({ limit: 100 });

        // Fetch all credit ledgers
        const { data: ledgers, error } = await supabaseAdmin
            .from('credit_ledger')
            .select('user_id, amount');

        if (error) {
            console.error('[Admin] Error fetching credit ledgers', error);
        }

        // Map balances
        const balances: Record<string, number> = {};
        if (ledgers) {
            (ledgers as { user_id: string, amount: number }[]).forEach(row => {
                balances[row.user_id] = (balances[row.user_id] || 0) + row.amount;
            });
        }

        // Map the required data
        const mappedUsers = users.map(user => {
            const role = (user.publicMetadata as { role?: string })?.role || 'user';
            const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress 
                        || user.emailAddresses[0]?.emailAddress 
                        || 'No Email';
            
            return {
                id: user.id,
                email: email,
                firstName: user.firstName,
                lastName: user.lastName,
                imageUrl: user.imageUrl,
                role: email.toLowerCase() === 'pauljizy@gmail.com' ? 'admin' : role,
                credits: balances[user.id] || 0,
                createdAt: user.createdAt
            };
        });

        // Sort: Admins first, then by creation date
        return mappedUsers.sort((a, b) => {
            if (a.role === 'admin' && b.role !== 'admin') return -1;
            if (a.role !== 'admin' && b.role === 'admin') return 1;
            return b.createdAt - a.createdAt;
        });

    } catch (error) {
        console.error('[Admin] Failed to fetch users list:', error);
        return [];
    }
}
