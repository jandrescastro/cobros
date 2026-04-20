import { redirect } from "next/navigation";
import { KeyRound, ShieldCheck } from "lucide-react";
import { getCurrentSession } from "@/lib/auth";
import { InviteSessionBridge } from "@/app/login/invite-session-bridge";
import { completeInvitedUserPassword } from "@/modules/auth/actions";

type SetupPasswordPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

const errorMessages: Record<string, string> = {
  password: "La contrasena debe tener minimo 4 caracteres y coincidir en ambos campos.",
  servidor: "No pudimos preparar tu cuenta. Intenta abrir de nuevo el enlace de invitacion."
};

export default async function SetupPasswordPage({ searchParams }: SetupPasswordPageProps) {
  const session = await getCurrentSession();

  const params = searchParams ? await searchParams : undefined;
  const errorMessage = params?.error ? errorMessages[params.error] ?? "No fue posible actualizar tu contrasena." : null;

  if (!session) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center bg-app-gradient px-4 py-8 text-ink">
        <section className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-soft">
          <InviteSessionBridge />
          <div className="space-y-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-white">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate">Activa tu acceso</p>
              <h1 className="font-display text-3xl font-extrabold uppercase">Preparando invitacion</h1>
            </div>
            <p className="text-sm leading-6 text-slate">
              Estamos validando tu enlace para llevarte a crear tu contrasena. Si no avanza, vuelve a abrir el correo de invitacion.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center bg-app-gradient px-4 py-8 text-ink">
      <section className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-soft">
        <div className="mb-6 space-y-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-white">
            <KeyRound className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate">Activa tu acceso</p>
            <h1 className="font-display text-3xl font-extrabold uppercase">Crea tu contrasena</h1>
          </div>
          <p className="text-sm leading-6 text-slate">
            Tu invitacion ya fue validada. Define una contrasena personal para entrar a la app y cambiarla solo desde tu propia cuenta.
          </p>
        </div>

        <div className="mb-5 rounded-2xl bg-sand p-4 text-sm text-slate">
          <p className="mb-1 flex items-center gap-2 font-semibold text-ink">
            <ShieldCheck className="h-4 w-4" />
            Cuenta detectada
          </p>
          {session.email || "Tu cuenta ya esta lista para terminar la configuracion."}
        </div>

        <form action={completeInvitedUserPassword} className="space-y-3">
          <input
            name="password"
            type="password"
            required
            minLength={4}
            className="w-full rounded-2xl border border-slate/15 px-4 py-3 text-sm outline-none"
            placeholder="Nueva contrasena"
          />
          <input
            name="confirmPassword"
            type="password"
            required
            minLength={4}
            className="w-full rounded-2xl border border-slate/15 px-4 py-3 text-sm outline-none"
            placeholder="Confirmar contrasena"
          />
          {errorMessage ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p> : null}
          <button type="submit" className="w-full rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white">
            Guardar contrasena
          </button>
        </form>
      </section>
    </main>
  );
}
