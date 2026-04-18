import type { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function SectionCard({ title, subtitle, action, children }: SectionCardProps) {
  return (
    <section className="rounded-card border border-[#dbe7ed] bg-white p-4 shadow-soft">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold tracking-[0.01em]">{title}</h2>
          {subtitle ? <p className="text-sm leading-6 text-slate">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
