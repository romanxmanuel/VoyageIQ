import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[linear-gradient(135deg,#65f5d4_0%,#14b8a6_55%,#0f766e_100%)] text-slate-950 font-semibold shadow-[0_16px_48px_rgba(20,184,166,0.28)] hover:brightness-105 active:scale-[0.99]",
  secondary:
    "border border-white/12 bg-white/6 text-white hover:bg-white/10 hover:border-white/20",
  ghost: "bg-transparent text-slate-300 hover:bg-white/6 hover:text-white"
};

export function Button({ className, variant = "primary", type = "button", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        className
      )}
      type={type}
      {...props}
    />
  );
}

