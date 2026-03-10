"use server"

import { supabaseAdmin } from "@/lib/supabase/server"
import { format } from "date-fns"

export async function getTotalUsers() {
  const { data, error } = await supabaseAdmin.from('jobs').select('user_id')
  if (error || !data) return 0
  const uniqueUsers = new Set((data as { user_id: string }[]).map(d => d.user_id))
  return uniqueUsers.size
}

export async function getStorageMetrics() {
  // Estimate based on number of clips and jobs in the database
  const { count: clipsCount } = await supabaseAdmin.from('clips').select('*', { count: 'exact', head: true });
  const { count: jobsCount } = await supabaseAdmin.from('jobs').select('*', { count: 'exact', head: true });
  
  // Realistically, a raw video download on Modal averages ~300MB, and extracted 30-sec clips average ~15MB.
  // We'll estimate usage without doing an expensive raw Supabase Storage Object scan
  const estimatedClipsMb = (clipsCount || 0) * 15;
  const estimatedJobsMb = (jobsCount || 0) * 300;
  
  const totalMB = estimatedClipsMb + estimatedJobsMb;
  const totalGB = totalMB > 1000 ? (totalMB / 1024).toFixed(2) : 0;
  
  return { 
    totalGB: Number(totalGB), 
    totalMB: totalMB 
  }
}

export async function getActivityHeatmapData() {
  const { data, error } = await supabaseAdmin.from('jobs').select('created_at')
  
  const heatmapMap = new Map<string, number>()
  if (error) {
    console.error('Error fetching heatmap data:', error)
    return []
  }

  if (data) {
      (data as { created_at: string }[]).forEach(job => {
          const dateStr = format(new Date(job.created_at), "yyyy-MM-dd")
          heatmapMap.set(dateStr, (heatmapMap.get(dateStr) || 0) + 1)
      })
  }
  
  return Array.from(heatmapMap.entries()).map(([date, count]) => ({ date, count }))
}

export async function getWorkerQueue() {
  // Fetch the 20 most recent jobs to show in the admin dashboard
  const { data, error } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
      
  if (error || !data) return []
  
  const jobs = data as unknown as {
      id: string
      video_url: string
      status: string
      processing_started_at: string | null
      processing_completed_at: string | null
  }[]

  return jobs.map(job => {
      let elapsed = "-"
      if (job.processing_started_at) {
          const start = new Date(job.processing_started_at).getTime()
          const end = job.processing_completed_at ? new Date(job.processing_completed_at).getTime() : new Date().getTime()
          const seconds = Math.floor((end - start) / 1000)
          
          if (seconds < 60) elapsed = `${seconds}s`
          else elapsed = `${Math.floor(seconds / 60)}m ${seconds % 60}s`
      }
      
      return {
          id: job.id,
          source: job.video_url,
          stage: job.status,
          status: job.status,
          elapsed: elapsed,
          url: job.video_url
      }
  })
}

export async function getEstimatedApiCosts() {
  const { data: jobs, error } = await supabaseAdmin.from('jobs').select('status, processing_started_at, processing_completed_at')
  
  let modalSeconds = 0;
  let successfulJobs = 0;

  if (!error && jobs) {
      jobs.forEach((job: any) => {
          if (job.status === 'completed' || job.status === 'success') {
              successfulJobs++;
          }
          if (job.processing_started_at) {
              const start = new Date(job.processing_started_at).getTime()
              const end = job.processing_completed_at ? new Date(job.processing_completed_at).getTime() : new Date().getTime()
              modalSeconds += Math.floor((end - start) / 1000)
          }
      })
  }

  // Modal L4 GPU cost is ~$0.74/hour -> ~$0.000205 per second.
  const modalCost = modalSeconds * 0.000205;
  
  // Gemini 1.5 Flash is extremely cheap ($0.075 per 1M tokens). Let's estimate roughly $0.005 per successfully analyzed video
  const geminiCost = successfulJobs * 0.005;

  return {
      modal: modalCost.toFixed(2),
      gemini: geminiCost.toFixed(2),
      total: (modalCost + geminiCost).toFixed(2)
  }
}
