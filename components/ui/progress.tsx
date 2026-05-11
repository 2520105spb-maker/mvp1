import { cn } from "@/lib/utils";

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-slate-800", className)} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} role="progressbar">
      <div className="h-full rounded-full bg-signal-orange transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}
