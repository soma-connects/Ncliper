import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ActivityHeatmap } from "@/components/ActivityHeatmap"
import { getTotalUsers, getStorageMetrics, getActivityHeatmapData, getWorkerQueue } from "./actions"

interface AdminJob {
  id: string
  source: string
  stage: string
  status: string
  elapsed: string
  url: string
}

export default async function AdminDashboard() {
  const [totalUsers, storageMetrics, heatmapData, workerQueue] = await Promise.all([
    getTotalUsers(),
    getStorageMetrics(),
    getActivityHeatmapData(),
    getWorkerQueue()
  ]);

  // Fallback if no worker queue data
  const jobs = workerQueue.length > 0 ? workerQueue : [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">Monitor system activity and active Modal engine processing jobs.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-card text-card-foreground shadow space-y-2 p-6">
          <h3 className="tracking-tight text-sm font-medium">Total Users</h3>
          <div className="text-2xl font-bold">{totalUsers}</div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow space-y-2 p-6">
          <h3 className="tracking-tight text-sm font-medium">Total Video Processed</h3>
          <div className="text-2xl font-bold">{storageMetrics.totalGB > 0 ? `${storageMetrics.totalGB} GB` : `${storageMetrics.totalMB} MB`}</div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Activity Map</h2>
        <div className="overflow-x-auto pb-4">
          <ActivityHeatmap data={heatmapData} />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Active Modal Workers</h2>
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job ID</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right">Time Elapsed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No active jobs.
                  </TableCell>
                </TableRow>
              ) : jobs.map((job: AdminJob) => (
                <TableRow key={job.id}>
                  <TableCell className="font-mono text-sm">{job.id}</TableCell>
                  <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]" title={job.source || job.url}>
                    {job.source || job.url || "N/A"}
                  </TableCell>
                  <TableCell>
                    {job.status === "processing" && (
                      <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 px-2 py-0.5 whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                          {job.stage || job.status}
                        </span>
                      </Badge>
                    )}
                    {job.status === "completed" || job.status === "success" && (
                      <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 whitespace-nowrap">
                        {job.stage || "Completed"}
                      </Badge>
                    )}
                    {job.status === "failed" || job.status === "error" && (
                      <Badge variant="destructive" className="px-2 py-0.5 whitespace-nowrap">
                        {job.stage || "Error"}
                      </Badge>
                    )}
                    {job.status === "queued" && (
                      <Badge variant="secondary" className="px-2 py-0.5 whitespace-nowrap">
                        {job.stage || "Queued"}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">{job.elapsed || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
