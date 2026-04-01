import { GoogleGenerativeAI } from "@google/generative-ai"
import type { LogEntry, QueryFilter } from "@/types/log"

const API_VERSION_TRIES: Array<{ apiVersion: "v1" } | undefined> = [
  { apiVersion: "v1" },
  undefined,
]

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined
const envModel =
  (import.meta.env.VITE_GEMINI_MODEL as string | undefined)?.trim() || undefined

/**
 * Ordered list: env override first, then stable/current Flash IDs for `v1beta` generateContent.
 * Note: `gemini-1.5-flash-latest` returns 404 on many keys — use `gemini-flash-latest` or versioned IDs.
 * @see https://ai.google.dev/gemini-api/docs/models/gemini
 */
function modelCandidates(): string[] {
  const base = [
    envModel,
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-flash-latest",
    "gemini-2.0-flash",
    "gemini-2.0-flash-001",
    "gemini-1.5-flash",
  ].filter((m): m is string => Boolean(m && m.length > 0))
  return [...new Set(base)]
}

function getGenAI(): GoogleGenerativeAI | null {
  if (!apiKey?.trim()) return null
  return new GoogleGenerativeAI(apiKey)
}

/** Avoid hard-fail when SDK `text()` throws (blocked/empty candidates). */
function safeResponseText(res: {
  response: {
    text: () => string
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> }
    }>
  }
}): string {
  try {
    return res.response.text().trim()
  } catch {
    const parts = res.response.candidates?.[0]?.content?.parts ?? []
    const joined = parts
      .map((p) => (typeof p.text === "string" ? p.text : ""))
      .join("")
      .trim()
    return (
      joined ||
      "(No text returned — response may be blocked or empty. Try a shorter prompt.)"
    )
  }
}

async function generateWithFallback(prompt: string): Promise<string> {
  const genAI = getGenAI()
  if (!genAI) throw new Error("No API key configured")

  let lastErr: unknown
  for (const modelName of modelCandidates()) {
    for (const opts of API_VERSION_TRIES) {
      try {
        const model = opts
          ? genAI.getGenerativeModel({ model: modelName }, opts)
          : genAI.getGenerativeModel({ model: modelName })
        const res = await model.generateContent(prompt)
        return safeResponseText(res)
      } catch (err) {
        lastErr = err
      }
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error("All Gemini model candidates failed")
}

function extractJsonObject(text: string): Record<string, unknown> | null {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const raw = fence?.[1]?.trim() ?? text.trim()
  const start = raw.indexOf("{")
  const end = raw.lastIndexOf("}")
  if (start === -1 || end === -1 || end <= start) return null
  try {
    return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>
  } catch {
    return null
  }
}

function toQueryFilter(obj: Record<string, unknown> | null): QueryFilter {
  if (!obj) return {}
  const level = obj.level ?? obj.severity
  const source = obj.source ?? obj.service
  const messageContains =
    obj.messageContains ?? obj.message ?? obj.contains ?? obj.q
  const time = obj.time ?? obj.window ?? obj.range
  return {
    level: typeof level === "string" ? level : undefined,
    source: typeof source === "string" ? source : undefined,
    messageContains:
      typeof messageContains === "string" ? messageContains : undefined,
    time: typeof time === "string" ? time : undefined,
  }
}

/** Local NL hints when offline or when the model returns non-JSON. */
function heuristicQueryFilter(naturalLanguagePrompt: string): QueryFilter {
  const q = naturalLanguagePrompt.toLowerCase()
  const filter: QueryFilter = {}
  if (/\berror\b|\berrors\b|\bfail/.test(q)) filter.level = "ERROR"
  if (/ssh|auth|login/.test(q)) filter.source = "Auth"
  if (/firewall|block|drop/.test(q)) filter.source = "Firewall"
  if (/kernel|oom|segfault/.test(q)) filter.source = "Kernel"
  if (/15\s*m|last\s*15/.test(q)) filter.time = "15m"
  if (/hour|1h/.test(q)) filter.time = "1h"
  if (/day|24h/.test(q)) filter.time = "24h"
  return filter
}

/** Prefer explicit model fields; fill gaps from local heuristics (e.g. time from "last hour"). */
function mergeFilters(api: QueryFilter, hints: QueryFilter): QueryFilter {
  return {
    level: api.level ?? hints.level,
    source: api.source ?? hints.source,
    time: api.time ?? hints.time,
    messageContains: api.messageContains ?? hints.messageContains,
  }
}

/** Chat / analysis over a slice of currently visible logs. */
export async function analyzeLogs(
  userPrompt: string,
  currentLogs: LogEntry[],
): Promise<string> {
  const genAI = getGenAI()
  const snippet = currentLogs.slice(0, 40).map((l) => ({
    ts: l.timestamp,
    level: l.level,
    source: l.source,
    message: l.message,
  }))

  const systemPreamble = `You are LuminaLog, a senior SOC analyst assistant. Be concise, actionable, and security-focused. The user sees ONLY this JSON log sample from their current grid view. If evidence is insufficient, say so.`

  if (!genAI) {
    return `[offline] Set VITE_GEMINI_API_KEY to enable live analysis.\n\nYou asked: "${userPrompt}"\nSample: ${snippet.length} rows. Example observation: repeated Auth failures often suggest credential stuffing or scan activity—check geo, UA, and user names.`
  }

  const prompt = `${systemPreamble}\n\nLogs JSON:\n${JSON.stringify(snippet)}\n\nUser question:\n${userPrompt}`
  return generateWithFallback(prompt)
}

/** Map natural language to a JSON filter object for the mock query engine. */
export async function translateToQuery(
  naturalLanguagePrompt: string,
): Promise<QueryFilter> {
  const genAI = getGenAI()
  const hints = heuristicQueryFilter(naturalLanguagePrompt)

  const instruction = `You convert natural language log search requests into ONE JSON object only. Fields (all optional): level (INFO|WARN|ERROR|CRITICAL), source (Firewall|Auth|Kernel or ssh/firewall/kernel aliases), messageContains (short substring), time (15m|1h|24h|7d|all).
Examples:
- "Show me only errors" -> {"level":"ERROR"}
- "SSH failures last hour" -> {"source":"Auth","messageContains":"Failed","time":"1h"}
- "Firewall blocks today" -> {"source":"Firewall","messageContains":"BLOCK","time":"24h"}
Return ONLY valid JSON, no markdown.`

  if (!genAI) {
    return hints
  }

  try {
    const raw = await generateWithFallback(
      `${instruction}\n\nRequest:\n${naturalLanguagePrompt}`,
    )
    const parsed = extractJsonObject(raw)
    const fromModel = toQueryFilter(parsed)
    return mergeFilters(fromModel, hints)
  } catch {
    return hints
  }
}
