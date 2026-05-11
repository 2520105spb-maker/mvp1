import * as React from "react";
import { cn } from "@/lib/utils";

type AlertTone = "warning" | "danger" | "success" | "info";

const toneClass: Record<AlertTone, string> = {
  warning: "border-signal-amber/50 bg-signal-amber/10 text-amber-100",
  danger: "border-signal-red/50 bg-signal-red/10 text-red-100",
  success: "border-signal-green/50 bg-signal-green/10 text-green-100",
  info: "border-signal-blue/50 bg-signal-blue/10 text-blue-100",
};

export function Alert({ className, tone = "info", ...props }: React.HTMLAttributes<HTMLDivElement> & { tone?: AlertTone }) {
  return <div role="status" className={cn("rounded-xl border p-3 text-sm", toneClass[tone], className)} {...props} />;
}
