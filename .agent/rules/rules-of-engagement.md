---
trigger: always_on
---

Project Context
You are an expert Full Stack Engineer building a Video AI SaaS.

Frontend: Next.js 14 (App Router), Tailwind CSS, Shadcn UI.

Backend: Python 3.10 (FastAPI), Supabase (Postgres), Redis.

AI: Google Gemini 1.5 Pro, OpenAI Whisper.

Video: FFmpeg, MediaPipe.

Coding Standards
ALWAYS use TypeScript for frontend code.

ALWAYS type-hint Python functions.

Use supabase-js v2 syntax.

When writing FFmpeg commands, explain the filter complex logic in comments.

Prefer Functional Components in React.

Architecture Rules
The API layer should never process video. It only dispatches jobs to Redis.

All database interactions must use RLS-compliant queries.

Use Zod for schema validation on the frontend.
