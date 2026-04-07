import { Loader2, Sparkles, Terminal, X } from "lucide-react"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { LogFileImport } from "@/components/layout/LogFileImport"
import { useDashboard } from "@/context/DashboardContext"
import { translateToQuery } from "@/services/geminiService"
import type { TimePreset } from "@/types/log"

export function TopBar() {
  const {
    searchText,
    setSearchText,
    structuredFilter,
    setStructuredFilter,
    setTimePreset,
    timePreset,
    setActiveTab,
  } = useDashboard()
  const [busy, setBusy] = useState(false)

  const hasAIFilter = useMemo(() => {
    return Object.values(structuredFilter).some((v) => v !== undefined && v !== "")
  }, [structuredFilter])

  function clearAIFilters() {
    setStructuredFilter({})
  }

  async function runMagic() {
    const query = searchText.trim()
    if (!query) return
    setBusy(true)
    try {
      const q = await translateToQuery(query)
      /* Apply structured filter from AI, then clear the NL text so it doesn't also
         act as a raw text filter (the structured filter already encodes the intent). */
      setStructuredFilter(q)
      setSearchText("")
      setActiveTab("logs")
    } catch (err) {
      console.error("AI query translation failed:", err)
      /* Fallback: keep the search text as a raw text filter */
    } finally {
      setBusy(false)
    }
  }

  return (
    <TooltipProvider delayDuration={300}>
      <header className="flex min-h-14 flex-col gap-2 border-b border-slate-800 bg-slate-950/80 px-3 py-2 backdrop-blur sm:flex-row sm:items-center sm:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Terminal className="hidden size-4 shrink-0 text-cyan-500/80 sm:block" />
          <Input
            className="font-mono text-xs"
            placeholder='Smart search — e.g. "SSH failures last hour" / raw text…'
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void runMagic()
            }}
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="default"
                disabled={busy || !searchText.trim()}
                onClick={() => void runMagic()}
                aria-label="Translate to structured filters"
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Magic: NL → filters (Gemini)</TooltipContent>
          </Tooltip>
          {hasAIFilter && (
            <div className="flex items-center gap-1 rounded-full border border-cyan-800/50 bg-cyan-950/40 px-2.5 py-1 font-sans text-[10px] text-cyan-300">
              <Sparkles className="size-3 text-cyan-400" />
              <span>
                AI filter
                {structuredFilter.level && ` · ${structuredFilter.level}`}
                {structuredFilter.source && ` · ${structuredFilter.source}`}
                {structuredFilter.time && ` · ${structuredFilter.time}`}
                {structuredFilter.messageContains && ` · "${structuredFilter.messageContains}"`}
              </span>
              <button
                type="button"
                onClick={clearAIFilters}
                className="ml-1 rounded-full p-0.5 text-cyan-400 hover:bg-cyan-800/40 hover:text-cyan-200"
                aria-label="Clear AI filters"
              >
                <X className="size-3" />
              </button>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LogFileImport />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-9 font-sans text-xs"
              >
                Quick ranges
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="end">
              <Command className="border-0">
                <CommandInput placeholder="Jump to range or preset…" />
                <CommandList>
                  <CommandEmpty>No matches.</CommandEmpty>
                  <CommandGroup heading="Time window">
                    {(
                      [
                        ["15m", "Last 15 minutes"],
                        ["1h", "Last hour"],
                        ["24h", "Last 24 hours"],
                        ["7d", "Last 7 days"],
                        ["all", "All time"],
                      ] as const
                    ).map(([id, label]) => (
                      <CommandItem
                        key={id}
                        value={label}
                        onSelect={() => setTimePreset(id as TimePreset)}
                      >
                        {label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <Tabs
            value={timePreset}
            onValueChange={(v) => setTimePreset(v as TimePreset)}
            className="w-full sm:w-auto"
          >
            <TabsList className="flex w-full flex-wrap sm:w-auto">
              <TabsTrigger className="font-sans text-[10px]" value="15m">
                15m
              </TabsTrigger>
              <TabsTrigger className="font-sans text-[10px]" value="1h">
                1h
              </TabsTrigger>
              <TabsTrigger className="font-sans text-[10px]" value="24h">
                24h
              </TabsTrigger>
              <TabsTrigger className="font-sans text-[10px]" value="7d">
                7d
              </TabsTrigger>
              <TabsTrigger className="font-sans text-[10px]" value="all">
                All
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>
    </TooltipProvider>
  )
}
