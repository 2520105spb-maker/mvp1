import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg" | "icon";
};

const variantClass: Record<ButtonVariant, string> = {
  primary: "bg-signal-orange text-black shadow-lg shadow-orange-950/30 hover:bg-orange-400 focus-visible:ring-signal-orange",
  secondary: "bg-graphite-800 text-slate-100 hover:bg-graphite-850 focus-visible:ring-slate-400",
  ghost: "bg-transparent text-slate-300 hover:bg-graphite-850 focus-visible:ring-slate-400",
  danger: "bg-signal-red text-white hover:bg-red-500 focus-visible:ring-signal-red",
  outline: "border border-slate-700 bg-transparent text-slate-200 hover:bg-graphite-850 focus-visible:ring-slate-400",
};

const sizeClass = {
  sm: "min-h-10 px-3 text-sm",
  md: "min-h-12 px-4 text-sm",
  lg: "min-h-14 px-5 text-base",
  icon: "h-12 w-12 p-0",
};

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 disabled:pointer-events-none disabled:opacity-50",
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...props}
    />
  );
}
