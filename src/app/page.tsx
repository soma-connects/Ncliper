'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { VideoInputSection } from '@/components/dashboard/VideoInputSection';
import { EditorView } from '@/components/dashboard/EditorView';
import { Video, Sparkles } from 'lucide-react';
import { Clip } from '@/lib/video/types';


import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';

export default function Home() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [generatedClips, setGeneratedClips] = useState<Clip[]>([]); // New State for clips

  // Fetch recent projects
  const { data: projects } = useQuery({
    queryKey: ['projects', userId],
    queryFn: async () => {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json();
    },
    enabled: !!userId,
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (vars: { url: string; title: string }) => {
      const res = await fetch('/api/projects', {
        method: 'POST',
        body: JSON.stringify(vars),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to create project');
      return res.json();
    },
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({ queryKey: ['projects', userId] });
      setActiveProjectId(newProject.id);
    },
  });

  // Find the active project from the list if selected
  const activeProject = projects?.find((p: any) => p.id === activeProjectId);

  const showEditor = activeProject?.status === 'completed' || activeProject?.status === 'processing' || !!activeProjectId || generatedClips.length > 0;

  const handleVideoFound = (url: string, title: string, clips: Clip[]) => {
    // 1. Set local state to show editor immediately with data
    setGeneratedClips(clips);

    // 2. Create Project in background for persistence
    createProjectMutation.mutate({ url, title });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col min-h-[calc(100vh-100px)]">
        {!activeProjectId && generatedClips.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center">
            <div className="mb-8 text-center">
              {projects?.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-white mb-4">Recent Projects</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto px-4">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {projects.map((p: any) => (
                      <div key={p.id} onClick={() => setActiveProjectId(p.id)} className="cursor-pointer bg-card/30 border border-border p-4 rounded-lg hover:bg-card/50 transition-colors text-left">
                        <h4 className="font-semibold text-white truncate">{p.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{p.status}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <VideoInputSection
              onVideoFound={handleVideoFound}
              isLoading={createProjectMutation.isPending}
            />
          </div>
        ) : (
          <EditorView
            projectId={activeProject?.id || 'temp'}
            projectTitle={activeProject?.title || 'New Project'}
            initialClips={generatedClips} // Pass clips!
          />
        )}
      </div>
    </DashboardLayout>
  );
}
