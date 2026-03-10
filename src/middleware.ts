import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
    '/',                    // Landing page
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/webhooks(.*)',
    '/api/health(.*)',
])

const isAdminRoute = createRouteMatcher(['/admin(.*)'])

export default clerkMiddleware(async (auth, request) => {
    if (isAdminRoute(request)) {
        const authObject = await auth()
        if (!authObject.userId) {
            await auth.protect()
        }
        
        // Ensure the user has the 'admin' role
        const metadata = authObject.sessionClaims?.metadata as { role?: string } | undefined
        const role = metadata?.role
        if (role !== 'admin') {
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
