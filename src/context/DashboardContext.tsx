/* Context module exports a provider and hook — standard pattern; Fast Refresh caveat ignored. */
/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { mockLogs } from "@/data/mockLogs"
import { filterLogs } from "@/lib/filterLogs"
import { parseLogFile } from "@/lib/parseLogFile"
import type { LogEntry, QueryFilter, TimePreset } from "@/types/log"

export type LogImportMeta = { fileName: string; rowCount: number }
export type TabType = "dash" | "logs" | "settings"

type DashboardContextValue = {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (v: boolean) => void
  aiOpen: boolean
  setAiOpen: (v: boolean) => void
  searchText: string
  setSearchText: (v: string) => void
  structuredFilter: QueryFilter
  setStructuredFilter: (v: QueryFilter) => void
  timePreset: TimePreset
  setTimePreset: (v: TimePreset) => void
  filteredLogs: LogEntry[]
  selectedLog: LogEntry | null
  setSelectedLog: (v: LogEntry | null) => void
  allLogs: LogEntry[]
  importMeta: LogImportMeta | null
  loadLogsFromFile: (file: File) => Promise<void>
  clearImportedLogs: () => void
}

const DashboardContext = createContext<DashboardContextValue | null>(null)

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabType>("dash")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [aiOpen, setAiOpen] = useState(true)
  const [searchText, setSearchText] = useState("")
  const [structuredFilter, setStructuredFilter] = useState<QueryFilter>({})
  const [timePreset, setTimePreset] = useState<TimePreset>("24h")
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)
  const [importedLogs, setImportedLogs] = useState<LogEntry[] | null>(null)
  const [importMeta, setImportMeta] = useState<LogImportMeta | null>(null)

  const allLogs = importedLogs ?? mockLogs

  const loadLogsFromFile = useCallback(async (file: File) => {
    const rows = await parseLogFile(file)
    setImportedLogs(rows)
    setImportMeta({ fileName: file.name, rowCount: rows.length })
    setStructuredFilter({})
    setSearchText("")
    setSelectedLog(null)
  }, [])

  const clearImportedLogs = useCallback(() => {
    setImportedLogs(null)
    setImportMeta(null)
    setStructuredFilter({})
    setSearchText("")
    setSelectedLog(null)
  }, [])

  const filteredLogs = useMemo(
    () =>
      filterLogs(allLogs, {
        searchText,
        structured: structuredFilter,
        timePreset,
      }),
    [allLogs, searchText, structuredFilter, timePreset],
  )

  const value = useMemo<DashboardContextValue>(
    () => ({
      activeTab,
      setActiveTab,
      sidebarCollapsed,
      setSidebarCollapsed,
      aiOpen,
      setAiOpen,
      searchText,
      setSearchText,
      structuredFilter,
      setStructuredFilter,
      timePreset,
      setTimePreset,
      filteredLogs,
      selectedLog,
      setSelectedLog,
      allLogs,
      importMeta,
      loadLogsFromFile,
      clearImportedLogs,
    }),
    [
      activeTab,
      sidebarCollapsed,
      aiOpen,
      searchText,
      structuredFilter,
      timePreset,
      filteredLogs,
      selectedLog,
      allLogs,
      importMeta,
      loadLogsFromFile,
      clearImportedLogs,
    ],
  )

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider")
  return ctx
}
