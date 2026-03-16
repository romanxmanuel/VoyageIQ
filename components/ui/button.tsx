import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[linear-gradient(135deg,#65f5d4_0%,#14b8a6_55%,#0f766e_100%)] text-slate-950 shadow-[0_18px_55px_rgba(20,184,166,0.35)] hover:brightness-105",
  secondary: "border border-white/15 bg-white/8 text-white hover:bg-white/12",
  ghost: "bg-transparent text-slate-200 hover:bg-white/6"
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

