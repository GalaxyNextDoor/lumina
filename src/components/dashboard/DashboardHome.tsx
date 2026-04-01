import { 
  Activity, 
  AlertCircle, 
  BarChart3, 
  Clock, 
  FileText, 
  ShieldAlert, 
  Terminal
} from "lucide-react"
import { useDashboard } from "@/context/DashboardContext"
import { useMemo } from "react"
import { cn } from "@/lib/utils"

export function DashboardHome() {
  const { allLogs } = useDashboard()

  const metrics = useMemo(() => {
    const total = allLogs.length
    const errors = allLogs.filter((log) => log.level === "error" || log.level === "critical").length
    const warnings = allLogs.filter((log) => log.level === "warning").length
    
    // Calculate events in the last 24 hours based on the timestamp string
    const now = new Date()
    const last24h = allLogs.filter((log) => {
      const logDate = new Date(log.timestamp)
      return (now.getTime() - logDate.getTime()) <= 24 * 60 * 60 * 1000
    }).length

    const errorRate = total > 0 ? ((errors / total) * 100).toFixed(1) : "0.0"

    return { total, errors, warnings, errorRate, last24h }
  }, [allLogs])

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-4 md:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard Overview</h1>
        <p className="text-slate-400">High-level insights into your application logs and system health.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric Card 1 */}
        <div className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900/50 p-5 shadow-sm backdrop-blur-sm transition-all hover:bg-slate-900/80 hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-sm font-medium">Total Events</span>
            <FileText className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold text-white">{metrics.total.toLocaleString()}</div>
          <div className="text-xs text-slate-500">All parsed log entries</div>
        </div>

        {/* Metric Card 2 */}
        <div className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900/50 p-5 shadow-sm backdrop-blur-sm transition-all hover:bg-slate-900/80 hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-sm font-medium">Critical / Errors</span>
            <ShieldAlert className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-3xl font-bold text-rose-500">{metrics.errors.toLocaleString()}</div>
          <div className="text-xs text-rose-500/80">{metrics.errorRate}% error rate</div>
        </div>

        {/* Metric Card 3 */}
        <div className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900/50 p-5 shadow-sm backdrop-blur-sm transition-all hover:bg-slate-900/80 hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-sm font-medium">Warnings</span>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-3xl font-bold text-amber-500">{metrics.warnings.toLocaleString()}</div>
          <div className="text-xs text-slate-500">Requires attention</div>
        </div>

        {/* Metric Card 4 */}
        <div className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900/50 p-5 shadow-sm backdrop-blur-sm transition-all hover:bg-slate-900/80 hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-sm font-medium">Recent Activity</span>
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-emerald-400">{metrics.last24h.toLocaleString()}</div>
          <div className="text-xs text-slate-500">Events in last 24 hours</div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">System Activity</h2>
              <p className="text-sm text-slate-400">Event distribution over time</p>
            </div>
            <BarChart3 className="h-5 w-5 text-slate-500" />
          </div>
          <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed border-slate-800 bg-slate-900/20">
            <div className="flex flex-col items-center gap-2 text-slate-500">
              <BarChart3 className="h-8 w-8 opacity-50" />
              <span className="text-sm">Chart visualization would be here</span>
              <span className="text-xs">Integrate Recharts or similar for full visualization</span>
            </div>
          </div>
        </div>

        <div className="col-span-3 rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Recent Errors</h2>
              <p className="text-sm text-slate-400">Latest issues requiring attention</p>
            </div>
            <Terminal className="h-5 w-5 text-slate-500" />
          </div>
          
          <div className="flex flex-col gap-3">
            {allLogs
              .filter(l => l.level === "error" || l.level === "critical")
              .slice(0, 5)
              .map((log, i) => (
                <div key={i} className="flex flex-col gap-1 rounded-lg border border-rose-900/30 bg-rose-950/20 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-rose-400">{log.service || "unknown-service"}</span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Clock className="h-3 w-3" />
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-sm text-slate-300">
                    {log.message}
                  </p>
                </div>
              ))}
              
              {metrics.errors === 0 && (
                <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-slate-500">
                  <ShieldAlert className="h-8 w-8 text-emerald-500/50" />
                  <span className="text-sm text-emerald-400">No errors detected recently</span>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  )
}
