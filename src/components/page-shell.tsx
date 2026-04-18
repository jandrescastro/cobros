import type { ReactNode } from "react";
import type { AppRole } from "@/lib/types";
import { BottomNav } from "@/components/bottom-nav";
import { SessionToolbar } from "@/components/session-toolbar";
import { cn } from "@/lib/utils";

type PageShellProps = {
  children: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  role: AppRole;
  viewerName: string;
};

export function PageShell({ children, title, description, actions, className, role, viewerName }: PageShellProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-app-gradient px-4 pb-28 pt-5 text-ink">
      <header className="mb-6 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-[0.7rem] font-bold uppercase tracking-[0.26em] text-slate">
              {role === "admin" ? "Control de accesos" : "Gestion mensual"}
            </p>
            <h1 className="font-display text-[2rem] font-extrabold uppercase leading-none tracking-[0.02em]">
              {title}
            </h1>
          </div>
          {actions ?? <SessionToolbar role={role} name={viewerName} />}
        </div>
        {description ? <p className="max-w-[34ch] text-[0.96rem] leading-6 text-slate">{description}</p> : null}
      </header>

      <section className={cn("space-y-4", className)}>{children}</section>
      <BottomNav role={role} />
    </main>
  );
}
