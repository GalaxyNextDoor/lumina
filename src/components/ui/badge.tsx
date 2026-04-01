import { cva, type VariantProps } from "class-variance-authority"
import type * as React from "react"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-mono font-medium uppercase tracking-wide",
  {
    variants: {
      variant: {
        default: "border-slate-700 bg-slate-900 text-slate-300",
        info: "border-sky-600/40 bg-sky-500/10 text-sky-300",
        warn: "border-amber-600/40 bg-amber-500/10 text-amber-300",
        error: "border-red-600/40 bg-red-500/10 text-red-300",
        critical: "border-fuchsia-600/40 bg-fuchsia-500/15 text-fuchsia-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export type BadgeProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof badgeVariants>

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge }
