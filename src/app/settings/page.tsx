import DashboardLayout from "@/components/layout/DashboardLayout";
import { Settings } from "lucide-react";

export default function SettingsPage() {
    return (
        <DashboardLayout>
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                    <Settings className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
                <p className="text-muted-foreground max-w-md">
                    Manage your account preferences, API keys, and billing subscription.
                </p>
            </div>
        </DashboardLayout>
    );
}
