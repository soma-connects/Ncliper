'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { useState } from "react";
import {
    LayoutDashboard,
    FolderOpen,
    Palette,
    Files,
    Settings,
    Video,
    LogOut,
    X,
    Loader2,
    Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CreditsBadge } from "@/components/dashboard/CreditsBadge";

const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: FolderOpen, label: "Projects", href: "/projects" },
    { icon: Files, label: "Templates", href: "/templates" },
    { icon: Palette, label: "Brand Kit", href: "/brand-kit" },
    { icon: Settings, label: "Settings", href: "/settings" },
];

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { signOut } = useClerk();
    const { user } = useUser();
    const [isSigningOut, setIsSigningOut] = useState(false);

    const isAdmin = user?.publicMetadata?.role === 'admin' || 
                    user?.primaryEmailAddress?.emailAddress === 'pauljizy@gmail.com';

    const handleSignOut = async () => {
        setIsSigningOut(true);
        await signOut({ redirectUrl: '/' });
    };

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                className={cn(
                    "w-64 h-screen border-r border-border bg-card/50 backdrop-blur-xl flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300",
                    // Mobile: slide in/out based on isOpen
                    isOpen ? "translate-x-0" : "-translate-x-full",
                    // Desktop: always visible
                    "lg:translate-x-0"
                )}
            >
                {/* Logo */}
                <div className="p-6 flex items-center justify-between border-b border-border/40">
                    <Link href="/" onClick={onClose} className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                            <Video className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                            Ncliper
                        </span>
                    </Link>
                    {/* Mobile close button */}
                    <button
                        onClick={onClose}
                        className="lg:hidden p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white transition-colors"
                        aria-label="Close sidebar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Nav links */}
                <nav className="flex-1 px-4 py-6 gap-2 flex flex-col overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== "/dashboard" && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={(e) => {
                                    if (item.href === "/dashboard") {
                                        // Force reset active state when clicking Dashboard
                                        e.preventDefault();
                                        window.location.href = "/dashboard";
                                    } else {
                                        onClose();
                                    }
                                }}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                                    isActive
                                        ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_20px_rgba(139,92,246,0.1)]"
                                        : "text-muted-foreground hover:text-white hover:bg-white/5"
                                )}
                            >
                                <item.icon className={cn(
                                    "w-5 h-5 transition-transform duration-300 group-hover:scale-110 flex-shrink-0",
                                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-white"
                                )}/>
                                <span className="font-medium truncate">{item.label}</span>

                                {isActive && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                            </Link>
                        );
                    })}

                    {/* Admin section */}
                    {isAdmin && (
                        <div className="mt-6 pt-6 border-t border-border/40">
                            <p className="px-4 mb-2 text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Admin</p>
                            <Link
                                href="/admin"
                                onClick={onClose}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                                    pathname.startsWith("/admin")
                                        ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]"
                                        : "text-muted-foreground hover:text-white hover:bg-white/5"
                                )}
                            >
                                <Shield className={cn(
                                    "w-5 h-5 transition-transform duration-300 group-hover:scale-110 flex-shrink-0",
                                    pathname.startsWith("/admin") ? "text-amber-500" : "text-muted-foreground group-hover:text-white"
                                )} />
                                <span className="font-medium truncate">Admin Panel</span>
                            </Link>
                        </div>
                    )}
                </nav>

                {/* Bottom section: Credits + Sign Out */}
                <div className="p-4 border-t border-border/40 space-y-2">
                    <div className="glass-card p-4 rounded-xl border border-white/5 bg-gradient-to-b from-white/5 to-transparent flex flex-col items-center">
                        <div className="mb-3 w-full flex justify-center">
                            <CreditsBadge />
                        </div>
                        <button className="w-full mt-2 py-1.5 text-xs font-medium bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg transition-colors">
                            Buy More Credits
                        </button>
                    </div>

                    {/* Sign Out — faster custom implementation with loading state */}
                    <button
                        onClick={handleSignOut}
                        disabled={isSigningOut}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSigningOut ? (
                            <Loader2 className="w-5 h-5 flex-shrink-0 animate-spin text-red-400" />
                        ) : (
                            <LogOut className="w-5 h-5 flex-shrink-0" />
                        )}
                        <span className="font-medium">{isSigningOut ? 'Signing Out...' : 'Sign Out'}</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
