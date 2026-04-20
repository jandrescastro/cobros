import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  tone?: "default" | "success" | "warning";
  href?: string;
};

const tones = {
  default: {
    card: "bg-white",
    value: "text-ink",
    hint: "text-slate"
  },
  success: {
    card: "border-emerald-200 bg-emerald-50",
    value: "text-emerald-700",
    hint: "text-emerald-700/80"
  },
  warning: {
    card: "border-red-200 bg-red-50",
    value: "text-red-700",
    hint: "text-red-700/80"
  }
};

export function StatCard({ label, value, hint, icon, tone = "default", href }: StatCardProps) {
  const content = (
    <article className={cn("rounded-card border border-white/70 p-4 shadow-soft", tones[tone].card)}>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-display text-[0.7rem] font-bold uppercase tracking-[0.12em] text-slate">
          {label}
        </span>
        {icon}
      </div>
      <p className={cn("font-display text-[1.7rem] font-extrabold leading-none tracking-tight", tones[tone].value)}>
        {value}
      </p>
      {hint ? <p className={cn("mt-2 text-[0.82rem] leading-5", tones[tone].hint)}>{hint}</p> : null}
    </article>
  );

  if (!href) {
    return content;
  }

  return <Link href={href} className="block">{content}</Link>;
}
