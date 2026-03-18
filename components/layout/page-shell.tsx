import { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

interface PageShellProps extends PropsWithChildren {
  className?: string;
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <main className={cn("mx-auto flex w-full max-w-7xl flex-col px-5 pb-24 pt-8 sm:px-8", className)}>
      {children}
    </main>
  );
}

