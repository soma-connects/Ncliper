'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    FolderOpen,
    Palette,
    Files,
    Settings,
    Video,
    LogOut,
    X
} from "lucide-react";
import { cn } from "@/lib/utils";

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
                    // Mobile: slide in/out
                    isOpen ? "translate-x-0" : "-translate-x-full",
                    // Desktop: always visible
                    "lg:translate-x-0"
                )}
            >
                <div className="p-6 flex items-center justify-between border-b border-border/40">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                            <Video className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                            Ncliper
                        </span>
                    </div>
                    {/* Mobile close button */}
                    <button
                        onClick={onClose}
                        className="lg:hidden p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-6 gap-2 flex flex-col">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== "/dashboard" && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                                    isActive
                                        ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_20px_rgba(139,92,246,0.1)]"
                                        : "text-muted-foreground hover:text-white hover:bg-white/5"
                                )}
                            >
                                <item.icon className={cn(
                                    "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-white"
                                )} />
                                <span className="font-medium">{item.label}</span>

                                {isActive && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-border/40">
                    <div className="glass-card p-4 rounded-xl mb-4 border border-white/5 bg-gradient-to-b from-white/5 to-transparent">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-semibold text-muted-foreground tracking-wider">CREDITS</span>
                            <span className="text-xs font-bold text-primary">85%</span>
                        </div>
                        <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden mb-2">
                            <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 w-[85%] rounded-full shadow-[0_0_10px_rgba(168,85,247,0.4)] animate-pulse" />
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                            <span>45m left</span>
                            <span>60m limit</span>
                        </div>

                        <button className="w-full mt-3 py-1.5 text-xs font-medium bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg transition-colors">
                            Upgrade Plan
                        </button>
                    </div>

                    <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-colors">
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
