import { clerkMiddleware, createRouteMatcher, createClerkClient } from '@clerk/nextjs/server'
const isPublicRoute = createRouteMatcher([
    '/',                    // Landing page
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/webhooks(.*)',
    '/api/health(.*)',
])

const isAdminRoute = createRouteMatcher(['/admin(.*)'])

const client = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })
export default clerkMiddleware(async (auth, request) => {
    if (isAdminRoute(request)) {
        const authObject = await auth()
        const { userId } = authObject
        if (!userId) {
            await auth.protect()
            return
        }
        
        // Fetch full user object to ensure we have current metadata and email
        const user = await client.users.getUser(userId)
        
        const metadata = user.publicMetadata as { role?: string } | undefined
        const role = metadata?.role
        
        // Loop through all emails to guarantee a match, case-insensitive
        const isEmailAdmin = user.emailAddresses.some(
            e => e.emailAddress.toLowerCase() === 'pauljizy@gmail.com'
        )
        
        if (role !== 'admin' && !isEmailAdmin) {
            return new Response(null, {
                status: 302,
                headers: { Location: new URL('/dashboard', request.url).toString() },
            })
        }
    } else if (!isPublicRoute(request)) {
        await auth.protect()
    }
})

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
}
