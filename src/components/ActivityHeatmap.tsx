"use client"

import { eachDayOfInterval, subDays, startOfDay, format } from "date-fns"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ActivityHeatmapProps {
  data: { date: string; count: number }[]
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  // Generate last 364 days (52 weeks * 7 days = 364 days)
  const today = startOfDay(new Date())
  const startDate = subDays(today, 363)
  const days = eachDayOfInterval({ start: startDate, end: today })

  // Map data to a fast lookup dictionary
  const activityMap = new Map<string, number>()
  data.forEach((d) => {
    activityMap.set(d.date, d.count)
  })

  // To align correctly, we must pad the start so the first column matches the correct day of the week
  const startDayOfWeek = startDate.getDay() // 0 = Sunday
  const emptyDays = Array.from({ length: startDayOfWeek }).map(() => null)

  const allCells = [...emptyDays, ...days]

  return (
    <div className="p-6 border rounded-xl bg-card">
      <TooltipProvider>
        <div className="grid grid-rows-7 grid-flow-col gap-1 w-max">
          {allCells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} className="w-3.5 h-3.5" /> // Empty placeholder
            
            const dateStr = format(day, "yyyy-MM-dd")
            const count = activityMap.get(dateStr) || 0
            
            let colorClass = "bg-muted"
            if (count === 1) colorClass = "bg-emerald-200/50"
            else if (count === 2) colorClass = "bg-emerald-400"
            else if (count === 3) colorClass = "bg-emerald-600"
            else if (count >= 4) colorClass = "bg-emerald-800"

            return (
              <Tooltip key={`day-${i}`} delayDuration={100}>
                <TooltipTrigger asChild>
                  <div className={`w-3.5 h-3.5 rounded-sm ${colorClass} hover:ring-2 hover:ring-emerald-500 hover:ring-offset-1 transition-all cursor-pointer`} />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    <strong>{count}</strong> videos processed on {format(day, "MMM d, yyyy")}
                  </p>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </TooltipProvider>
    </div>
  )
}
