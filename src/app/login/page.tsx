import Link from "next/link";
import { redirect } from "next/navigation";
import { LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth";
import { loginWithPassword } from "@/modules/auth/actions";

type LoginPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

const errorMessages: Record<string, string> = {
  credenciales: "No pudimos iniciar sesion con ese correo y contrasena.",
  perfil: "Tu usuario existe, pero todavia no tiene perfil configurado."
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const profile = await getCurrentProfile();

  if (profile) {
    redirect(profile.rol === "admin" ? "/admin/usuarios" : "/");
  }

  const params = searchParams ? await searchParams : undefined;
  const errorMessage = params?.error ? errorMessages[params.error] ?? "No fue posible entrar." : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center bg-app-gradient px-4 py-8 text-ink">
      <section className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-soft">
        <div className="mb-6 space-y-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-white">
            <LockKeyhole className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate">Acceso privado</p>
            <h1 className="font-display text-3xl font-extrabold uppercase">Cobros mensuales</h1>
          </div>
          <p className="text-sm leading-6 text-slate">
            Cada usuario entra con su propio acceso y solo ve los clientes que le asignaste.
          </p>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-sand p-3 text-sm text-slate">
            <p className="mb-1 flex items-center gap-2 font-semibold text-ink">
              <ShieldCheck className="h-4 w-4" />
              Admin
            </p>
            Gestiona usuarios y asignaciones.
          </div>
          <div className="rounded-2xl bg-sand p-3 text-sm text-slate">
            <p className="mb-1 flex items-center gap-2 font-semibold text-ink">
              <UserRound className="h-4 w-4" />
              Usuario
            </p>
            Revisa solo su cartera asignada.
          </div>
        </div>

        <form action={loginWithPassword} className="space-y-3">
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-2xl border border-slate/15 px-4 py-3 text-sm outline-none"
            placeholder="Correo"
          />
          <input
            name="password"
            type="password"
            required
            className="w-full rounded-2xl border border-slate/15 px-4 py-3 text-sm outline-none"
            placeholder="Contrasena"
          />
          {errorMessage ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p> : null}
          <button type="submit" className="w-full rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white">
            Entrar
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate">
          Si aun no tienes usuario, pidelo a tu administrador desde el panel de accesos.
        </p>

        <Link href="https://supabase.com/dashboard" className="mt-4 inline-flex text-sm font-semibold text-ink">
          Abrir Supabase
        </Link>
      </section>
    </main>
  );
}
