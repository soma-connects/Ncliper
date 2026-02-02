import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

            <Sidebar />
            <Topbar />

            <main className="pl-64 pt-6 min-h-[calc(100vh-80px)] relative z-10 p-8">
                <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {children}
                </div>
            </main>
        </div>
    );
}
