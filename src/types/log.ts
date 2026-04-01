export type LogLevel = "INFO" | "WARN" | "ERROR" | "CRITICAL"

export type LogSource = "Firewall" | "Auth" | "Kernel"

export type LogEntry = {
  id: string
  timestamp: string
  level: LogLevel
  /** Free-form (e.g. Auth, Firewall, or app/service name from uploads). */
  source: string
  message: string
  details?: Record<string, unknown>
}

/** Structured filter from Gemini `translateToQuery` + local filtering. */
export type QueryFilter = {
  level?: LogLevel | string
  source?: string
  messageContains?: string
  time?: "15m" | "1h" | "24h" | "7d" | "all" | string
}

export type TimePreset = "15m" | "1h" | "24h" | "7d" | "all"
