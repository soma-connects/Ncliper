'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { VideoInputSection } from '@/components/dashboard/VideoInputSection';
import { EditorView } from '@/components/dashboard/EditorView';
import { Trash2 } from 'lucide-react';
import { Clip } from '@/lib/video/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';

export default function Home() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [generatedClips, setGeneratedClips] = useState<Clip[]>([]);

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

  // Fetch clips for active project
  const { data: projectClips } = useQuery({
    queryKey: ['clips', activeProjectId],
    queryFn: async () => {
      if (!activeProjectId) return [];
      const res = await fetch(`/api/projects/${activeProjectId}/clips`);
      if (!res.ok) throw new Error('Failed to fetch clips');
      const data = await res.json();
      // API returns the array of clips directly, not wrapped in an object
      return Array.isArray(data) ? data : (data.clips || []);
    },
    enabled: !!activeProjectId,
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

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete project');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', userId] });
      if (activeProjectId) setActiveProjectId(null);
    },
  });

  // Find the active project
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeProject = projects?.find((p: any) => p.id === activeProjectId);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project?')) {
      deleteProjectMutation.mutate(id);
    }
  };

  const handleVideoFound = (url: string, title: string, clips: Clip[]) => {
    setGeneratedClips(clips);
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
                      <div key={p.id} onClick={() => setActiveProjectId(p.id)} className="cursor-pointer bg-card/30 border border-border p-4 rounded-lg hover:bg-card/50 transition-colors text-left group relative">
                        <h4 className="font-semibold text-white truncate pr-8">{p.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1 capitalize">{p.status}</p>

                        <button
                          onClick={(e) => handleDelete(e, p.id)}
                          className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-red-500/20 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                          title="Delete Project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
            initialClips={projectClips || generatedClips}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
