import { Loader2, Upload } from "lucide-react"
import { useCallback, useRef, useState, type ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { useDashboard } from "@/context/DashboardContext"

export function LogFileImport() {
  const { importMeta, loadLogsFromFile, clearImportedLogs } = useDashboard()
  const inputRef = useRef<HTMLInputElement>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onPick = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ""
      if (!file) return
      setErr(null)
      setLoading(true)
      try {
        await loadLogsFromFile(file)
      } catch (ex) {
        setErr(ex instanceof Error ? ex.message : String(ex))
      } finally {
        setLoading(false)
      }
    },
    [loadLogsFromFile],
  )

  return (
    <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.json,.jsonl,.txt,application/json,text/csv,text/plain"
        className="sr-only"
        aria-label="Import log file"
        onChange={(e) => void onPick(e)}
      />
      <Button
        type="button"
        variant="outline"
        className="h-9 shrink-0 font-sans text-xs"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
      >
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Upload className="size-3.5" />
        )}
        <span className="hidden sm:inline">Import logs</span>
        <span className="sm:hidden">Import</span>
      </Button>
      {importMeta ? (
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="truncate font-mono text-[10px] text-slate-500"
            title={importMeta.fileName}
          >
            {importMeta.fileName} · {importMeta.rowCount} rows
          </span>
          <Button
            type="button"
            variant="ghost"
            className="h-8 shrink-0 px-2 font-sans text-[10px] text-cyan-400 hover:text-cyan-300"
            onClick={clearImportedLogs}
          >
            Use sample data
          </Button>
        </div>
      ) : null}
      {err ? (
        <span className="font-sans text-[10px] text-red-400" title={err}>
          {err.length > 80 ? `${err.slice(0, 80)}…` : err}
        </span>
      ) : null}
    </div>
  )
}
