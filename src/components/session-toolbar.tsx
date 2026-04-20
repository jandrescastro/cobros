import { LogOut, ShieldCheck, UserRound } from "lucide-react";
import type { AppRole } from "@/lib/types";
import { logout } from "@/modules/auth/actions";

type SessionToolbarProps = {
  role: AppRole;
  name: string;
};

export function SessionToolbar({ role, name }: SessionToolbarProps) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <div className="min-w-0 rounded-2xl bg-white/85 px-2.5 py-1.5 text-right shadow-soft">
        <p className="text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-slate">
          {role === "admin" ? "Administrador" : "Usuario"}
        </p>
        <p className="flex max-w-[5.7rem] items-center justify-end gap-1 text-xs font-semibold leading-tight text-ink sm:max-w-[7rem]">
          {role === "admin" ? <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> : <UserRound className="h-3.5 w-3.5 shrink-0" />}
          <span className="truncate">{name}</span>
        </p>
      </div>
      <form action={logout}>
        <button
          type="submit"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white shadow-soft"
          aria-label="Cerrar sesion"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}
