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
      <header className="mb-5 space-y-2.5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="font-display text-[0.62rem] font-bold uppercase tracking-[0.22em] text-slate">
              Gestion de cobros
            </p>
            <h1 className="font-display text-[1.65rem] font-extrabold uppercase leading-none tracking-[0.01em] sm:text-[1.9rem]">
              {title}
            </h1>
          </div>
          <div className="flex justify-end sm:block">{actions ?? <SessionToolbar role={role} name={viewerName} />}</div>
        </div>
        {description ? <p className="max-w-[32ch] text-[0.9rem] leading-6 text-slate">{description}</p> : null}
      </header>

      <section className={cn("space-y-4", className)}>{children}</section>
      <BottomNav role={role} />
    </main>
  );
}
