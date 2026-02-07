import DashboardLayout from "@/components/layout/DashboardLayout";
import { Palette } from "lucide-react";

export default function BrandKitPage() {
    return (
        <DashboardLayout>
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                    <Palette className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Brand Kit</h1>
                <p className="text-muted-foreground max-w-md">
                    Upload your logos, fonts, and color palettes to keep your clips consistent with your brand identity.
                </p>
            </div>
        </DashboardLayout>
    );
}
