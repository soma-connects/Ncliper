import { getStorageMetrics } from "../actions"

export default async function StorageAdminPage() {
  const metrics = await getStorageMetrics()

  const formattedSize = metrics.totalGB > 0 ? `${metrics.totalGB} GB` : `${metrics.totalMB.toLocaleString()} MB`
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Storage</h1>
        <p className="text-muted-foreground">Monitor S3/R2 bucket usage and manage raw video retention policies.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <h3 className="tracking-tight text-sm font-medium">Total Size (Estimate)</h3>
          <div className="text-2xl font-bold">{formattedSize}</div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <h3 className="tracking-tight text-sm font-medium">Auto-Prune Policy</h3>
          <div className="text-2xl font-bold text-amber-500">7 Days</div>
          <p className="text-xs text-muted-foreground mt-1">Raw MP4s are deleted after 7 days to save costs.</p>
        </div>
      </div>
    </div>
  )
}
