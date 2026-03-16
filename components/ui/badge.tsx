import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-white/12 bg-white/6 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-cyan-100",
        className
      )}
      {...props}
    />
  );
}

