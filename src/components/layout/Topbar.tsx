import { Bell, Search, ChevronDown, Sparkles } from "lucide-react";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

export function Topbar() {
    return (
        <header className="h-20 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-8 pl-72 transition-all duration-300">

            {/* Left: Breadcrumbs / Title */}
            <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold tracking-tight text-white">Dashboard</h1>
                <div className="h-6 w-[1px] bg-border" />
                <span className="text-sm text-muted-foreground">Overview</span>
            </div>

            {/* Middle: Search (Optional, could be global) */}
            <div className="flex-1 max-w-xl mx-8 relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search projects, clips, or templates..."
                    className="w-full bg-secondary/50 border border-border rounded-full pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/70"
                />
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4">
                {/* Upgrade Button */}
                <button className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-primary to-purple-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-shadow">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>UPGRADE PRO</span>
                </button>

                <div className="h-6 w-[1px] bg-border mx-2" />

                <button className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-background" />
                </button>

                <div className="flex items-center gap-3 pl-2">
                    <SignedIn>
                        <UserButton
                            appearance={{
                                elements: {
                                    avatarBox: "w-8 h-8 rounded-full border-2 border-background shadow-lg"
                                }
                            }}
                        />
                        <div className="hidden md:flex flex-col items-start gap-0.5">
                            <span className="text-xs font-semibold text-white">
                                <span className="opacity-70">Welcome back</span>
                            </span>
                            <span className="text-[10px] text-muted-foreground">Free Plan</span>
                        </div>
                    </SignedIn>
                    <SignedOut>
                        {/* This helps avoids layout shift or provides a fallback if needed */}
                        <div className="w-8 h-8 rounded-full bg-secondary animate-pulse" />
                    </SignedOut>
                </div>
            </div>
        </header>
    );
}
