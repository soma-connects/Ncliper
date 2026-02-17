import { FolderOpen } from "lucide-react";

export default function ProjectsPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <FolderOpen className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Projects</h1>
            <p className="text-muted-foreground max-w-md">
                Manage all your video projects in one place. Advanced filtering and foldering coming soon.
            </p>
        </div>
    );
}
