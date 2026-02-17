import { Files } from "lucide-react";

export default function TemplatesPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <Files className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Templates</h1>
            <p className="text-muted-foreground max-w-md">
                Pre-designed viral templates for your clips. Select from our library or create your own.
            </p>
        </div>
    );
}
