import { getEstimatedApiCosts } from "../actions"

export default async function CostsAdminPage() {
  const costs = await getEstimatedApiCosts();
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API Costs</h1>
        <p className="text-muted-foreground">Track expenses across Gemini, OpenAI, Modal, and Supabase.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <h3 className="tracking-tight text-sm font-medium">Gemini 1.5 Pro</h3>
          <div className="text-2xl font-bold">${costs.gemini}</div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <h3 className="tracking-tight text-sm font-medium">Modal Compute</h3>
          <div className="text-2xl font-bold">${costs.modal}</div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <h3 className="tracking-tight text-sm font-medium">Whisper/Speech</h3>
          <div className="text-2xl font-bold">Inc.</div>
          <p className="text-xs text-muted-foreground mt-1">Included in Modal compute</p>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <h3 className="tracking-tight text-sm font-medium">Estimated Total (MTD)</h3>
          <div className="text-2xl font-bold text-red-400">${costs.total}</div>
        </div>
      </div>
    </div>
  )
}
