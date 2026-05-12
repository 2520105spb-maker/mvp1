import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-12 w-full rounded-xl border border-slate-700 bg-navy-900 px-3 text-base text-slate-50 outline-none placeholder:text-slate-500 focus:border-signal-orange focus:ring-2 focus:ring-signal-orange/25 disabled:opacity-70",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "min-h-12 w-full rounded-xl border border-slate-700 bg-navy-900 px-3 text-base text-slate-50 outline-none focus:border-signal-orange focus:ring-2 focus:ring-signal-orange/25 disabled:opacity-70",
        className,
      )}
      {...props}
    />
  );
}
