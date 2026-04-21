import { LogOut, ShieldCheck, UserRound } from "lucide-react";
import type { AppRole } from "@/lib/types";
import { logout } from "@/modules/auth/actions";

type SessionToolbarProps = {
  role: AppRole;
  name: string;
};

export function SessionToolbar({ role, name }: SessionToolbarProps) {
  return (
    <div className="flex w-full shrink-0 items-center gap-2 rounded-[1.35rem] bg-white/78 px-2 py-2 shadow-soft sm:w-auto">
      <div className="min-w-0 flex-1 rounded-xl bg-white/85 px-2.5 py-1.5 text-left">
        <p className="text-[0.56rem] font-semibold uppercase tracking-[0.14em] text-slate">
          {role === "admin" ? "Administrador" : "Usuario"}
        </p>
        <p className="flex items-center gap-1 text-xs font-semibold leading-tight text-ink">
          {role === "admin" ? <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> : <UserRound className="h-3.5 w-3.5 shrink-0" />}
          <span className="truncate">{name}</span>
        </p>
      </div>
      <form action={logout}>
        <button
          type="submit"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white"
          aria-label="Cerrar sesion"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}
