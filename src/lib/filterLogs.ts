import type { LogEntry, QueryFilter, TimePreset } from "@/types/log"

const LEVELS = new Set(["INFO", "WARN", "ERROR", "CRITICAL"])

function normalizeLevel(v: string | undefined): LogEntry["level"] | undefined {
  if (!v) return undefined
  const u = v.trim().toUpperCase()
  if (LEVELS.has(u)) return u as LogEntry["level"]
  return undefined
}

function windowMs(preset: TimePreset): number | null {
  switch (preset) {
    case "15m":
      return 15 * 60_000
    case "1h":
      return 60 * 60_000
    case "24h":
      return 24 * 60 * 60_000
    case "7d":
      return 7 * 24 * 60 * 60_000
    case "all":
    default:
      return null
  }
}

function parseTimePreset(q: QueryFilter["time"], fallback: TimePreset): TimePreset {
  const t = (q ?? "").toString().toLowerCase()
  if (t === "15m" || t === "1h" || t === "24h" || t === "7d" || t === "all") return t
  if (t.includes("15") && t.includes("m")) return "15m"
  if (t.includes("hour") || t === "1h") return "1h"
  if (t.includes("day") && !t.includes("7")) return "24h"
  if (t.includes("week") || t.includes("7")) return "7d"
  return fallback
}

export function filterLogs(
  logs: LogEntry[],
  options: {
    searchText: string
    structured: QueryFilter
    timePreset: TimePreset
  },
): LogEntry[] {
  const { searchText, structured, timePreset } = options
  const effectivePreset = parseTimePreset(structured.time, timePreset)
  const ms = windowMs(effectivePreset)
  const now = Date.now()

  const level = normalizeLevel(
    structured.level?.toString(),
  )

  const sourceFilter = structured.source?.trim().toLowerCase()
  const isAIActive = Object.keys(structured).length > 0
  const needle = isAIActive 
    ? (structured.messageContains?.trim() || "").toLowerCase()
    : searchText.trim().toLowerCase()

  return logs.filter((row) => {
    if (ms !== null) {
      const t = Date.parse(row.timestamp)
      /* Keep rows with unparseable timestamps visible (common in CSV exports). */
      if (Number.isFinite(t) && now - t > ms) return false
    }
    if (level && row.level !== level) return false
    if (sourceFilter && row.source.toLowerCase() !== sourceFilter) {
      const srcMap: Record<string, string> = {
        ssh: "auth",
        authentication: "auth",
        login: "auth",
        firewall: "firewall",
        iptables: "firewall",
        kernel: "kernel",
      }
      const mapped = srcMap[sourceFilter] ?? sourceFilter
      if (row.source.toLowerCase() !== mapped) return false
    }
    if (needle) {
      const hay = `${row.message} ${row.source} ${row.level}`.toLowerCase()
      if (!hay.includes(needle)) return false
    }
    return true
  })
}
