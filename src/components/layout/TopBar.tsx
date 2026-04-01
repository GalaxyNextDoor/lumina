import { Loader2, Sparkles, Terminal } from "lucide-react"
import { useState } from "react"
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
    setStructuredFilter,
    setTimePreset,
    timePreset,
    setActiveTab,
  } = useDashboard()
  const [busy, setBusy] = useState(false)

  async function runMagic() {
    if (!searchText.trim()) return
    setBusy(true)
    try {
      const q = await translateToQuery(searchText)
      /* Replace NL-derived filters each run — merge was stacking constraints and could empty the grid. */
      setStructuredFilter(q)
      setActiveTab("logs")
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
