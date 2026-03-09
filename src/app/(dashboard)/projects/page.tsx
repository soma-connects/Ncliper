'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { FolderOpen, Trash2, Video } from "lucide-react";
import { useRouter } from 'next/navigation';

export default function ProjectsPage() {
    const { userId } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();

    const { data: projects, isLoading } = useQuery({
        queryKey: ['projects', userId],
        queryFn: async () => {
            const res = await fetch('/api/projects');
            if (!res.ok) throw new Error('Failed to fetch projects');
            return res.json();
        },
        enabled: !!userId,
    });

    const deleteProjectMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete project');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects', userId] });
        },
    });

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this project?')) {
            deleteProjectMutation.mutate(id);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6"></div>
                <h1 className="text-xl font-bold text-white mb-2">Loading Projects...</h1>
            </div>
        );
    }

    if (!projects || projects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                    <FolderOpen className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">No Projects Yet</h1>
                <p className="text-muted-foreground max-w-md mb-8">
                    You haven&apos;t generated any clips yet. Head back to the dashboard to start clipping your first video!
                </p>
                <button
                    onClick={() => router.push('/dashboard')}
                    className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:scale-105 transition-transform"
                >
                    Go to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <FolderOpen className="w-5 h-5 text-primary" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">All Projects</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {projects.map((p: any) => (
                    <div
                        key={p.id}
                        onClick={() => router.push(`/dashboard?project=${p.id}`)}
                        className="cursor-pointer bg-card/40 border border-white/5 p-5 rounded-2xl hover:bg-card/60 hover:border-white/10 transition-all text-left group relative shadow-lg overflow-hidden"
                    >
                        <div className="w-10 h-10 bg-black/40 rounded-lg flex items-center justify-center mb-4">
                            <Video className="w-5 h-5 text-white/70" />
                        </div>
                        <h4 className="font-bold text-white text-lg truncate pr-8 mb-2 group-hover:text-primary transition-colors">{p.title}</h4>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-muted-foreground bg-black/40 px-2 py-1 rounded-md uppercase tracking-wider">{p.status}</span>
                            <span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</span>
                        </div>

                        <button
                            onClick={(e) => handleDelete(e, p.id)}
                            className="absolute top-4 right-4 p-2 rounded-lg bg-black/50 hover:bg-red-500/20 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                            title="Delete Project"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
