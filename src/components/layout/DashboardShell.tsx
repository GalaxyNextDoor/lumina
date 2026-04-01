import { ChatPanel } from "@/components/layout/ChatPanel"
import { Sidebar } from "@/components/layout/Sidebar"
import { TopBar } from "@/components/layout/TopBar"
import { LogTable } from "@/components/logs/LogTable"
import { DashboardHome } from "@/components/dashboard/DashboardHome"
import { SettingsPage } from "@/components/settings/SettingsPage"
import { DashboardProvider, useDashboard } from "@/context/DashboardContext"

function DashboardContent() {
  const { activeTab } = useDashboard()

  return (
    <div className="flex h-svh min-h-0 w-full bg-[#020617] text-slate-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex min-h-0 flex-1 items-stretch gap-0 p-3">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            {activeTab === "logs" && <LogTable />}
            {activeTab === "dash" && <DashboardHome />}
            {activeTab === "settings" && <SettingsPage />}
          </div>
          <ChatPanel />
        </main>
      </div>
    </div>
  )
}

export function DashboardShell() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  )
}
