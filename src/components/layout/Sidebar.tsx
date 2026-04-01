import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  ScrollText,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useDashboard } from "@/context/DashboardContext"

const items = [
  { key: "dash", label: "Dashboard", icon: LayoutDashboard },
  { key: "logs", label: "Logs", icon: ScrollText },
  { key: "settings", label: "Settings", icon: Settings },
] as const

export function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed, activeTab, setActiveTab } = useDashboard()

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex h-full shrink-0 flex-col border-r border-slate-800 bg-slate-950/90 transition-[width]",
          sidebarCollapsed ? "w-14" : "w-52",
        )}
      >
        <div className="flex h-12 items-center border-b border-slate-800 px-2">
          <div
            className={cn(
              "flex min-w-0 flex-1 items-center gap-2 px-2 font-sans text-sm font-semibold tracking-tight text-cyan-300",
              sidebarCollapsed && "justify-center px-0",
            )}
          >
            <span className="size-2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]" />
            {!sidebarCollapsed && <span className="truncate">LuminaLog</span>}
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-2">
          {items.map(({ key, label, icon: Icon }) => (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-2 text-slate-300 hover:text-cyan-200",
                    sidebarCollapsed && "justify-center px-0",
                    activeTab === key && "bg-slate-800 text-cyan-400"
                  )}
                  onClick={() => setActiveTab(key as typeof activeTab)}
                >
                  <Icon className="size-4 shrink-0 text-cyan-400/90" />
                  {!sidebarCollapsed && (
                    <span className="font-sans text-xs">{label}</span>
                  )}
                </Button>
              </TooltipTrigger>
              {sidebarCollapsed && (
                <TooltipContent side="right">{label}</TooltipContent>
              )}
            </Tooltip>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn("w-full gap-1", sidebarCollapsed && "px-0")}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <>
                <ChevronLeft className="size-4" />
                <span className="font-sans text-xs">Collapse</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  )
}
