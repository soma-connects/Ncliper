export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            projects: {
                Row: {
                    id: string
                    created_at: string
                    user_id: string
                    title: string
                    video_url: string
                    thumbnail_url: string | null
                    status: 'pending' | 'processing' | 'completed' | 'failed'
                    metadata: Json | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    user_id?: string // This will be handled by RLS/Trigger usually, or passed from Auth
                    title: string
                    video_url: string
                    thumbnail_url?: string | null
                    status?: 'pending' | 'processing' | 'completed' | 'failed'
                    metadata?: Json | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    user_id?: string
                    title?: string
                    video_url?: string
                    thumbnail_url?: string | null
                    status?: 'pending' | 'processing' | 'completed' | 'failed'
                    metadata?: Json | null
                }
            }
            clips: {
                Row: {
                    id: string
                    created_at: string
                    project_id: string
                    title: string
                    start_time: number
                    end_time: number
                    video_url: string | null // path to processed clip
                    virality_score: number | null
                    transcript_segment: Json | null // The specific transcript part
                }
                Insert: {
                    id?: string
                    created_at?: string
                    project_id: string
                    title: string
                    start_time: number
                    end_time: number
                    video_url?: string | null
                    virality_score?: number | null
                    transcript_segment?: Json | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    project_id?: string
                    title?: string
                    start_time?: number
                    end_time?: number
                    video_url?: string | null
                    virality_score?: number | null
                    transcript_segment?: Json | null
                }
            }
        }
    }
}
