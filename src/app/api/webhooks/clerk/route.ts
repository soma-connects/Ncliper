import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { grantCredits } from '@/lib/billing/credits'

export async function POST(req: Request) {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

    if (!WEBHOOK_SECRET) {
        throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
    }

    // Get the headers
    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response('Error occured -- no svix headers', {
            status: 400
        })
    }

    // Get the body
    const payload = await req.json()
    const body = JSON.stringify(payload);

    // Create a new Svix instance with your secret.
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: WebhookEvent

    // Verify the payload with the headers
    try {
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        }) as WebhookEvent
    } catch (err) {
        console.error('Error verifying webhook:', err);
        return new Response('Error occured', {
            status: 400
        })
    }

    // Extract the specific event type
    const eventType = evt.type;

    // Listen for the User Created event
    if (eventType === 'user.created') {
        const { id, email_addresses } = evt.data;
        const primaryEmail = email_addresses ? email_addresses[0]?.email_address : 'unknown';

        console.log(`[Webhook] New user signed up: ${id} (${primaryEmail})`);

        // Grant the magic moment free credits!
        const success = await grantCredits(
            id,
            60, // 60 Credits = 60 Minutes = 1 hour of free time
            'signup_bonus',
            'Welcome to Ncliper! Here are 60 free credits to get started.',
            { email: primaryEmail }
        );

        if (success) {
            console.log(`[Webhook] Granted 60 signup credits to ${id}`);
        } else {
            console.error(`[Webhook] Failed to grant signup credits to ${id}`);
        }
    }

    return new Response('', { status: 200 })
}
