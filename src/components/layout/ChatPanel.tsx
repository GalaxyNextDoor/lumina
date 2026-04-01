import { Bot, Loader2, MessageSquare, Trash2, Wand2 } from "lucide-react"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useDashboard } from "@/context/DashboardContext"
import { analyzeLogs, translateToQuery } from "@/services/geminiService"

type ChatMessage = { role: "user" | "assistant"; text: string }

export function ChatPanel() {
  const { aiOpen, setAiOpen, filteredLogs, setStructuredFilter, setSearchText, setActiveTab } =
    useDashboard()
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Ask about the visible log slice — summaries, attack hypotheses, or next checks. Context refreshes with your filters.",
    },
  ])
  const endRef = useRef<HTMLDivElement | null>(null)

  function clearContext() {
    setMessages([
      {
        role: "assistant",
        text: "Context cleared. New session.",
      },
    ])
  }

  async function send() {
    const text = input.trim()
    if (!text || busy) return
    setInput("")
    setMessages((m) => [...m, { role: "user", text }])
    setBusy(true)
    try {
      const reply = await analyzeLogs(text, filteredLogs)
      setMessages((m) => [...m, { role: "assistant", text: reply }])
      queueMicrotask(() => endRef.current?.scrollIntoView({ behavior: "smooth" }))
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: `[error] ${err instanceof Error ? err.message : String(err)}`,
        },
      ])
    } finally {
      setBusy(false)
    }
  }

  async function applyLastToQuery() {
    const lastUser = [...messages].reverse().find((m) => m.role === "user")
    if (!lastUser) return
    setBusy(true)
    try {
      const q = await translateToQuery(lastUser.text)
      setStructuredFilter(q)
      setSearchText(lastUser.text)
      setActiveTab("logs")
    } finally {
      setBusy(false)
    }
  }

  if (!aiOpen) {
    return (
      <button
        type="button"
        onClick={() => setAiOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/95 px-4 py-2 font-sans text-xs text-cyan-300 shadow-lg backdrop-blur hover:bg-slate-900"
      >
        <MessageSquare className="size-4" />
        AI
      </button>
    )
  }

  return (
    <aside className="flex h-full min-h-0 w-[min(100%,380px)] shrink-0 flex-col border-l border-slate-800 bg-slate-950/90">
      <div className="flex h-12 items-center justify-between border-b border-slate-800 px-3">
        <div className="flex items-center gap-2 font-sans text-sm font-medium text-slate-100">
          <Bot className="size-4 text-cyan-400" />
          Lumina AI
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-slate-400"
          onClick={() => setAiOpen(false)}
        >
          Hide
        </Button>
      </div>
      <ScrollArea className="min-h-0 flex-1 px-3 py-3">
        <div className="flex flex-col gap-3 pr-2">
          {messages.map((m, i) => (
            <div
              key={`${i}-${m.text.slice(0, 12)}`}
              className={
                m.role === "user"
                  ? "ml-6 rounded-lg border border-cyan-900/40 bg-cyan-950/30 p-2 font-sans text-xs text-cyan-50"
                  : "mr-4 rounded-lg border border-slate-800 bg-slate-900/50 p-2 font-sans text-xs text-slate-200"
              }
            >
              {m.text}
            </div>
          ))}
          {busy && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="size-3 animate-spin" />
              Thinking…
            </div>
          )}
          <div ref={endRef} />
        </div>
      </ScrollArea>
      <div className="flex flex-col gap-2 border-t border-slate-800 p-3">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 flex-1 font-sans text-xs"
            onClick={clearContext}
          >
            <Trash2 className="size-3.5" />
            Clear
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-8 flex-1 font-sans text-xs"
            disabled={busy}
            onClick={() => void applyLastToQuery()}
          >
            <Wand2 className="size-3.5" />
            Apply to query
          </Button>
        </div>
        <div className="flex gap-2">
          <Input
            className="font-sans text-xs"
            placeholder="Ask about visible logs…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void send()
            }}
          />
          <Button
            type="button"
            size="sm"
            disabled={busy || !input.trim()}
            onClick={() => void send()}
          >
            Send
          </Button>
        </div>
      </div>
    </aside>
  )
}
