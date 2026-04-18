import { LogOut, ShieldCheck, UserRound } from "lucide-react";
import type { AppRole } from "@/lib/types";
import { logout } from "@/modules/auth/actions";

type SessionToolbarProps = {
  role: AppRole;
  name: string;
};

export function SessionToolbar({ role, name }: SessionToolbarProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="rounded-2xl bg-white/85 px-3 py-2 text-right shadow-soft">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate">
          {role === "admin" ? "Administrador" : "Usuario"}
        </p>
        <p className="flex items-center justify-end gap-1 text-sm font-semibold text-ink">
          {role === "admin" ? <ShieldCheck className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
          {name}
        </p>
      </div>
      <form action={logout}>
        <button
          type="submit"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-ink text-white shadow-soft"
          aria-label="Cerrar sesion"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
