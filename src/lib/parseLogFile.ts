import type { LogEntry, LogLevel } from "@/types/log"

const LEVEL_ALIASES: Record<string, LogLevel> = {
  DEBUG: "INFO",
  TRACE: "INFO",
  INFORMATION: "INFO",
  VERBOSE: "INFO",
  WARNING: "WARN",
  WRN: "WARN",
  ERR: "ERROR",
  FATAL: "CRITICAL",
  SEVERE: "CRITICAL",
  PANIC: "CRITICAL",
}

function coerceLevel(raw: unknown): LogLevel {
  if (raw == null || raw === "") return "INFO"
  const u = String(raw).trim().toUpperCase()
  if (u === "INFO" || u === "WARN" || u === "ERROR" || u === "CRITICAL") return u
  return LEVEL_ALIASES[u] ?? "INFO"
}

function normKey(k: string): string {
  return k.trim().toLowerCase().replace(/^[@#]/, "")
}

/** Map common column / field names to canonical keys. */
function fieldMap(): Record<string, keyof MappedFields> {
  return {
    timestamp: "timestamp",
    time: "timestamp",
    ts: "timestamp",
    date: "timestamp",
    datetime: "timestamp",
    "_time": "timestamp",
    timegenerated: "timestamp",
    "@timestamp": "timestamp",
    createtime: "timestamp",
    level: "level",
    severity: "level",
    priority: "level",
    loglevel: "level",
    status: "level",
    source: "source",
    facility: "source",
    logger: "source",
    service: "source",
    host: "source",
    component: "source",
    app: "source",
    channel: "source",
    sourcetype: "source",
    message: "message",
    msg: "message",
    text: "message",
    body: "message",
    log: "message",
    event: "message",
    "@message": "message",
    description: "message",
    line: "message",
  }
}

type MappedFields = {
  timestamp?: unknown
  level?: unknown
  source?: unknown
  message?: unknown
}

function pickMapped(row: Record<string, unknown>): MappedFields {
  const map = fieldMap()
  const out: MappedFields = {}
  for (const [key, val] of Object.entries(row)) {
    const canon = map[normKey(key)]
    if (canon && val != null && val !== "") {
      out[canon] = out[canon] ?? val
    }
  }
  return out
}

function formatTimestamp(raw: unknown): string {
  if (raw == null) return new Date(0).toISOString()
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const ms = raw < 1e12 ? raw * 1000 : raw
    return new Date(ms).toISOString()
  }
  const s = String(raw).trim()
  if (!s) return new Date(0).toISOString()
  const n = Number(s)
  if (Number.isFinite(n) && /^\d+\.?\d*$/.test(s)) {
    const ms = n < 1e12 ? n * 1000 : n
    return new Date(ms).toISOString()
  }
  const parsed = Date.parse(s)
  if (Number.isFinite(parsed)) return new Date(parsed).toISOString()
  return s
}

function rowToLogEntry(row: Record<string, unknown>, index: number): LogEntry {
  const m = pickMapped(row)
  let message =
    m.message != null && m.message !== ""
      ? String(m.message)
      : ""
  if (!message) {
    const skip = new Set(["timestamp", "level", "source", "severity", "time", "ts"])
    const parts: string[] = []
    for (const [k, v] of Object.entries(row)) {
      if (skip.has(normKey(k))) continue
      if (v != null && String(v).length > 0)
        parts.push(`${k}=${String(v)}`)
    }
    message = parts.join(" ") || JSON.stringify(row)
  }
  const trimmedMessage = message.slice(0, 50_000)
  return {
    id: `import-${index}`,
    timestamp: formatTimestamp(m.timestamp),
    level: coerceLevel(m.level),
    source:
      m.source != null && String(m.source).trim() !== ""
        ? String(m.source).trim()
        : "Unknown",
    message: trimmedMessage,
    details: row,
  }
}

function asRecordArray(data: unknown): Record<string, unknown>[] | null {
  if (!Array.isArray(data)) return null
  return data.filter((x): x is Record<string, unknown> => x !== null && typeof x === "object" && !Array.isArray(x))
}

function extractJsonRows(data: unknown): Record<string, unknown>[] | null {
  const arr = asRecordArray(data)
  if (arr) return arr
  if (data !== null && typeof data === "object" && !Array.isArray(data)) {
    const o = data as Record<string, unknown>
    const keys = [
      "logs",
      "events",
      "records",
      "data",
      "results",
      "items",
      "entries",
      "value",
      "rows",
    ]
    for (const k of keys) {
      const inner = o[k]
      const rows = asRecordArray(inner)
      if (rows?.length) return rows
    }
    return [o]
  }
  return null
}

function parseJsonText(text: string): LogEntry[] {
  const trimmed = text.trim()
  const rows: Record<string, unknown>[] = []
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    const data = JSON.parse(trimmed) as unknown
    const extracted = extractJsonRows(data)
    if (extracted) rows.push(...extracted)
  } else {
    for (const line of trimmed.split(/\r?\n/)) {
      const l = line.trim()
      if (!l) continue
      try {
        const obj = JSON.parse(l) as unknown
        if (obj !== null && typeof obj === "object" && !Array.isArray(obj))
          rows.push(obj as Record<string, unknown>)
      } catch {
        /* skip bad line */
      }
    }
  }
  return rows.map((r, i) => rowToLogEntry(r, i))
}

function parseCSVLine(line: string): string[] {
  const out: string[] = []
  let cur = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      inQuotes = !inQuotes
    } else if (c === "," && !inQuotes) {
      out.push(cur.trim())
      cur = ""
    } else {
      cur += c
    }
  }
  out.push(cur.trim())
  return out
}

function parseCSVText(text: string): LogEntry[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length === 0) return []
  const headers = parseCSVLine(lines[0]!).map((h) => h.replace(/^"|"$/g, ""))
  const rows: Record<string, unknown>[] = []
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCSVLine(lines[i]!).map((c) => c.replace(/^"|"$/g, ""))
    const row: Record<string, unknown> = {}
    headers.forEach((h, j) => {
      row[h] = cells[j] ?? ""
    })
    rows.push(row)
  }
  return rows.map((r, i) => rowToLogEntry(r, i))
}

export function parseLogFileText(text: string, fileName: string): LogEntry[] {
  const lower = fileName.toLowerCase()
  const t = text.trim()
  if (!t) return []

  if (lower.endsWith(".json") || lower.endsWith(".jsonl")) {
    return parseJsonText(text)
  }
  if (lower.endsWith(".csv")) {
    return parseCSVText(text)
  }

  if (t.startsWith("{") || t.startsWith("[")) {
    try {
      return parseJsonText(text)
    } catch {
      return parseCSVText(text)
    }
  }
  if (t.includes(",") && t.split(/\r?\n/).length > 1) {
    return parseCSVText(text)
  }
  try {
    return parseJsonText(text)
  } catch {
    return parseCSVText(text)
  }
}

export async function parseLogFile(file: File): Promise<LogEntry[]> {
  const text = await file.text()
  const rows = parseLogFileText(text, file.name)
  if (rows.length === 0) {
    throw new Error(
      "No log rows found. Use JSON array of objects, JSON Lines, or CSV with a header row.",
    )
  }
  return rows
}
