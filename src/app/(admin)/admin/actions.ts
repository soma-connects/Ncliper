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
  // In a real app we'd query the Supabase storage schema or R2 bucket metrics
  // For MVP, we return a mock value
  return { totalGB: 0, totalMB: 500 }
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
