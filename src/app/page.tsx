'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { VideoInputSection } from '@/components/dashboard/VideoInputSection';
import { EditorView } from '@/components/dashboard/EditorView';
import { Video, Sparkles } from 'lucide-react';

export default function Home() {
  const [project, setProject] = useState<{ url: string; title: string } | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  // Simulate processing time before showing Editor
  useEffect(() => {
    if (project && !showEditor) {
      // In a real app, this would be polling the backend status
      const timer = setTimeout(() => {
        setShowEditor(true);
      }, 3000); // 3 seconds fake processing time
      return () => clearTimeout(timer);
    }
  }, [project, showEditor]);

  return (
    <DashboardLayout>
      <div className="flex flex-col min-h-[calc(100vh-100px)]">
        {!project ? (
          <div className="flex-1 flex flex-col justify-center">
            <VideoInputSection onVideoFound={(url, title) => setProject({ url, title })} />
          </div>
        ) : !showEditor ? (
          <div className="flex-1 flex flex-col justify-center items-center">
            <div className="w-full max-w-4xl mx-auto space-y-6 text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 animate-pulse">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-white tracking-tight">Analyzing "{project.title}"</h2>
              <p className="text-muted-foreground">Our AI agents are watching the video, identifying viral hooks, and generating captions...</p>

              <div className="w-full max-w-lg mx-auto h-2 bg-secondary rounded-full overflow-hidden mt-8">
                <div className="h-full bg-gradient-to-r from-primary to-purple-500 w-1/3 animate-[shimmer_2s_infinite]" style={{ width: '60%' }} />
              </div>

              <div className="mt-8 p-6 border border-dashed border-border rounded-2xl bg-card/30 backdrop-blur-sm">
                <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground font-mono">
                  <Video className="w-4 h-4" />
                  <span>{project.url}</span>
                </div>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => setProject(null)}
                  className="text-sm font-medium text-muted-foreground hover:text-white transition-colors underline decoration-border underline-offset-4 hover:decoration-white"
                >
                  Cancel Analysis
                </button>
              </div>
            </div>
          </div>
        ) : (
          <EditorView projectTitle={project.title} />
        )}
      </div>
    </DashboardLayout>
  );
}
