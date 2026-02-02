import Link from "next/link";
import {
    LayoutDashboard,
    FolderOpen,
    Palette,
    Files,
    Settings,
    Video,
    LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: FolderOpen, label: "Projects", href: "/projects" },
    { icon: Files, label: "Templates", href: "/templates" },
    { icon: Palette, label: "Brand Kit", href: "/brand-kit" },
    { icon: Settings, label: "Settings", href: "/settings" },
];

export function Sidebar() {
    return (
        <aside className="w-64 h-screen border-r border-border bg-card/50 backdrop-blur-xl flex flex-col fixed left-0 top-0 z-50">
            <div className="p-6 flex items-center gap-2 border-b border-border/40">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                    <Video className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                    Ncliper
                </span>
            </div>

            <nav className="flex-1 px-4 py-6 gap-2 flex flex-col">
                {navItems.map((item, index) => (
                    <Link
                        key={index}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                            index === 0
                                ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_20px_rgba(139,92,246,0.1)]"
                                : "text-muted-foreground hover:text-white hover:bg-white/5"
                        )}
                    >
                        <item.icon className={cn(
                            "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                            index === 0 ? "text-primary" : "text-muted-foreground group-hover:text-white"
                        )} />
                        <span className="font-medium">{item.label}</span>

                        {index === 0 && (
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                    </Link>
                ))}
            </nav>

            <div className="p-4 border-t border-border/40">
                <div className="glass-card p-4 rounded-xl mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-muted-foreground">CREDITS</span>
                        <span className="text-xs font-bold text-white">85%</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 w-[85%] rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">
                        45/60 mins remaining
                    </p>
                </div>

                <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-colors">
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Sign Out</span>
                </button>
            </div>
        </aside>
    );
}
