export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-black bg-[url('/grid-pattern.svg')] bg-center relative">
            {/* Dark overlay to make the grid subtle */}
            <div className="absolute inset-0 bg-black/80 pointer-events-none" />

            {/* Glow effect behind the form */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 blur-[100px] rounded-full pointer-events-none" />

            <div className="relative z-10 w-full max-w-md px-4">
                {children}
            </div>
        </div>
    )
}
