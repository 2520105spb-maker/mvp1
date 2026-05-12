import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "default" | "success" | "warning" | "danger" | "info" | "muted";

const toneClass: Record<BadgeTone, string> = {
  default: "border-signal-orange/50 bg-signal-orange/15 text-orange-200",
  success: "border-signal-green/40 bg-signal-green/10 text-green-200",
  warning: "border-signal-amber/40 bg-signal-amber/10 text-amber-200",
  danger: "border-signal-red/40 bg-signal-red/10 text-red-200",
  info: "border-signal-blue/40 bg-signal-blue/10 text-blue-200",
  muted: "border-slate-700 bg-slate-800/70 text-slate-300",
};

export function Badge({ className, tone = "default", ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold", toneClass[tone], className)}
      {...props}
    />
  );
}
