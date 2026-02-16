# Ncliper - Viral Video Clipper

AI-powered video clipper that transforms long-form YouTube videos into viral short-form content.

## Prerequisites

- **Node.js**: v18 or later.
- **FFmpeg**: Must be installed and available in your system PATH, or placed in the project root as `ffmpeg.exe` (Windows).
- **Python**: Required for `yt-dlp` to function correctly.

## Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/ncliper.git
    cd ncliper
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Setup**:
    - Copy `.env.example` to `.env.local`:
      ```bash
      cp .env.example .env.local
      ```
    - Fill in the required keys (Supabase, Google Gemini, Clerk).

4.  **Native Binaries (Important)**:
    - This project uses `fluent-ffmpeg` and `youtube-dl-exec`.
    - **Windows**: Ensure `ffmpeg.exe` is in the project root or globally in PATH.
    - **Mac/Linux**: Install via Homebrew/apt (`brew install ffmpeg`).

## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Scripts

- `npm run dev`: Start dev server.
- `npm run build`: Build for production.
- `npm run lint`: Run Next.js linter.
- `npm run typecheck`: Run TypeScript compiler check.
- `npm test`: Run Jest tests.

## Architecture

- **Frontend**: Next.js 15 (App Router), React, TailwindCSS.
- **Backend Actions**: Server Actions in `src/lib/video`.
- **AI**: Google Gemini (Flash 1.5/2.0) for virality analysis.
- **Processing**: FFmpeg for cutting, cropping, and captioning.
- **Database**: Supabase (PostgreSQL).
- **Auth**: Clerk.

## Security Note

Video processing uses `youtube-dl-exec` and `ffmpeg`. Input URLs are validated, but ensure your server environment is secure. Do not expose `ffmpeg` arguments directly to user input.

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/ncliper)

**Quick Steps:**

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   vercel login
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Configure Environment Variables** in Vercel Dashboard (see [.env.production.example](./.env.production.example))

📖 **Detailed Guide**: See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for complete deployment instructions.

### Python Worker Deployment

The video processing worker requires separate deployment:
- **Modal** (Recommended - $30/month free credits)
- **Render.com** (100% free forever)
- **Google Cloud Run** (Generous free tier)

📖 **Worker Setup**: See [WORKER_DEPLOYMENT.md](./WORKER_DEPLOYMENT.md) for detailed instructions.

---

## 🏗️ Project Structure

```
ncliper/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── api/          # API routes (jobs, projects, health)
│   │   └── page.tsx      # Main landing/editor page
│   ├── components/       # React components
│   │   ├── editor/       # Video editor UI (VideoPlayer, ClipRail, etc.)
│   │   └── ui/          # Shared UI components
│   └── lib/
│       ├── video/        # Video processing actions & utilities
│       ├── worker/       # Worker integration (Modal, Redis)
│       └── supabase/     # Database client & queries
├── python/
│   └── worker/          # Python video processing worker
├── public/              # Static assets
└── supabase/            # Database migrations & schema
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see LICENSE file for details.

