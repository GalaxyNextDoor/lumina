import { GoogleGenerativeAI } from "@google/generative-ai"
import type { LogEntry, QueryFilter } from "@/types/log"

/**
 * The SDK handles API version routing internally — we don't need to force it.
 * Passing undefined lets the SDK pick the right version for each model.
 */

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined
const envModel =
  (import.meta.env.VITE_GEMINI_MODEL as string | undefined)?.trim() || undefined

/**
 * Ordered list of model candidates to try.
 * env override first, then current stable models.
 * As of April 2026: gemini-2.0-flash and gemini-1.5-flash are deprecated/removed.
 * @see https://ai.google.dev/gemini-api/docs/models
 */
function modelCandidates(): string[] {
  const base = [
    envModel,
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-flash-latest",
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

/** Add a timeout wrapper so the UI never hangs forever. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Request timed out after ${ms / 1000}s`)), ms)
    promise.then(
      (v) => { clearTimeout(timer); resolve(v) },
      (e) => { clearTimeout(timer); reject(e) },
    )
  })
}

async function generateWithFallback(prompt: string): Promise<string> {
  const genAI = getGenAI()
  if (!genAI) throw new Error("No API key configured")

  let lastErr: unknown
  for (const modelName of modelCandidates()) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName })
      const res = await withTimeout(model.generateContent(prompt), 30_000)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return safeResponseText(res as any)
    } catch (err) {
      lastErr = err
      /* Continue to next model candidate */
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

  const systemPreamble = `You are LuminaLog, a senior SOC analyst assistant.
IMPORTANT RULES:
- Always respond in **natural language** (plain English), NOT raw JSON.
- Be concise, actionable, and security-focused.
- Use bullet points or short paragraphs for readability.
- Summarize patterns, flag anomalies, and suggest next steps.
- The user sees ONLY this log sample from their current grid view (${snippet.length} rows).
- If evidence is insufficient, say so clearly.
- NEVER just echo back the logs as JSON.`

  if (!genAI) {
    return `[offline] Set VITE_GEMINI_API_KEY to enable live analysis.\n\nYou asked: "${userPrompt}"\nSample: ${snippet.length} rows. Example observation: repeated Auth failures often suggest credential stuffing or scan activity—check geo, UA, and user names.`
  }

  const prompt = `${systemPreamble}\n\nLogs JSON (for your analysis only — do NOT repeat in response):\n${JSON.stringify(snippet)}\n\nUser question:\n${userPrompt}`
  return generateWithFallback(prompt)
}

/** Map natural language to a JSON filter object for the mock query engine. */
export async function translateToQuery(
  naturalLanguagePrompt: string,
): Promise<QueryFilter> {
  const genAI = getGenAI()
  const hints = heuristicQueryFilter(naturalLanguagePrompt)

  const instruction = `You convert natural language log search requests into ONE JSON object only.
Available fields (all optional, use ONLY what the user asked for — do NOT invent extra constraints):
- level: one of INFO, WARN, ERROR, or CRITICAL. Only include if the user explicitly mentions a severity.
- source: one of Auth, Firewall, or Kernel (map SSH/login/authentication to Auth, iptables to Firewall). Only include if the user mentions a source.
- messageContains: a SHORT keyword substring to match against log messages. Keep it broad (e.g. "Failed" not "Failed password for"). Only include if the user mentions specific content.
- time: one of 15m, 1h, 24h, 7d, or all. Only include if the user mentions a time range.

Examples:
- "Show me only errors" -> {"level":"ERROR"}
- "SSH failures last hour" -> {"source":"Auth","level":"ERROR","time":"1h"}
- "Firewall blocks today" -> {"source":"Firewall","messageContains":"BLOCK","time":"24h"}
- "What happened in the last 15 minutes" -> {"time":"15m"}
- "Show everything" -> {}
Return ONLY valid JSON, no markdown, no explanation.`

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
