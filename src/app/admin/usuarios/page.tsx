import { KeyRound, Pencil, ShieldPlus, Trash2, UserPlus } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageShell } from "@/components/page-shell";
import { SectionCard } from "@/components/section-card";
import { requireProfile } from "@/lib/auth";
import { getAdminUserManagementData } from "@/lib/admin";
import { createManagedUser, deleteManagedUser, updateManagedUser } from "@/modules/auth/actions";

type AdminUsersPageProps = {
  searchParams?: Promise<{ error?: string; created?: string; deleted?: string; updated?: string }>;
};

const errorMessages: Record<string, string> = {
  "service-role": "Falta SUPABASE_SERVICE_ROLE_KEY en .env.local para poder crear usuarios.",
  datos: "Revisa usuario y contrasena. El usuario debe tener entre 3 y 30 caracteres y puede usar letras, numeros, espacios, punto, guion o guion bajo.",
  "crear-usuario": "No pudimos crear el usuario en Supabase Auth.",
  "usuario-existe": "Ese nombre de usuario ya existe.",
  password: "La contrasena debe tener al menos 4 caracteres.",
  perfil: "El usuario se creo en Auth, pero fallo la creacion del perfil.",
  "editar-usuario": "No fue posible actualizar el usuario seleccionado.",
  "no-admin-delete": "No puedes borrar el usuario administrador con sesion activa.",
  "eliminar-usuario": "No fue posible borrar el usuario seleccionado."
};

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const profile = await requireProfile(["admin"]);
  const { usuarios, serviceRoleConfigured } = await getAdminUserManagementData();
  const params = searchParams ? await searchParams : undefined;
  const feedback = params?.error ? errorMessages[params.error] ?? "Ocurrio un error inesperado." : null;
  const success = params?.created === "1";
  const deleted = params?.deleted === "1";
  const updated = params?.updated === "1";

  return (
    <PageShell
      title="Usuarios"
      description="Crea usuarios basicos con acceso directo. Todos comparten la misma cartera de clientes y cobros."
      role={profile.rol}
      viewerName={profile.nombre}
    >
      <SectionCard title="Nuevo usuario" subtitle="Crealo con usuario y contrasena, sin usar correos" action={<UserPlus className="h-5 w-5 text-ink" />}>
        {!serviceRoleConfigured ? (
          <EmptyState
            title="Falta la service role key"
            description="Agrega SUPABASE_SERVICE_ROLE_KEY en .env.local para habilitar la creacion de usuarios desde esta pantalla."
          />
        ) : null}

        {feedback ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{feedback}</p> : null}
        {success ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Usuario creado correctamente.</p> : null}
        {deleted ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Usuario borrado correctamente.</p> : null}
        {updated ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Usuario actualizado correctamente.</p> : null}

        <form action={createManagedUser} className="space-y-3">
          <input
            name="username"
            required
            className="w-full rounded-2xl border border-slate/15 px-4 py-3 text-sm outline-none"
            placeholder="Usuario"
          />
          <input
            name="password"
            type="password"
            required
            minLength={4}
            className="w-full rounded-2xl border border-slate/15 px-4 py-3 text-sm outline-none"
            placeholder="Contrasena"
          />
          <div className="rounded-2xl border border-slate/15 bg-sand/60 px-4 py-3 text-sm leading-6 text-ink">
            Crea el acceso directamente desde aqui. Luego podras editar el usuario o cambiarle la contrasena cuando lo necesites.
          </div>

          <button type="submit" className="w-full rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white" disabled={!serviceRoleConfigured}>
            Crear usuario
          </button>
        </form>
      </SectionCard>

      <SectionCard title="Usuarios creados" subtitle="Edita usuario y contrasena desde el mismo listado" action={<ShieldPlus className="h-5 w-5 text-ink" />}>
        {usuarios.length === 0 ? (
          <EmptyState title="Aun no hay usuarios" description="Crea el primer usuario desde el formulario superior." />
        ) : (
          <div className="space-y-3">
            {usuarios.map((usuario) => (
              <article key={usuario.id} className="rounded-2xl border border-slate/10 bg-white px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{usuario.nombre}</p>
                    <p className="text-sm text-slate">Usuario activo en cartera compartida.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <form action={deleteManagedUser}>
                      <input type="hidden" name="userId" value={usuario.id} />
                      <button
                        type="submit"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600"
                        title="Borrar usuario"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </div>
                <form action={updateManagedUser} className="mt-3 grid gap-3 rounded-2xl bg-sand/50 p-3 sm:grid-cols-[1fr_1fr_auto]">
                  <input type="hidden" name="userId" value={usuario.id} />
                  <div>
                    <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate">
                      <Pencil className="h-3.5 w-3.5" />
                      Usuario
                    </p>
                    <input
                      name="username"
                      required
                      defaultValue={usuario.nombre}
                      className="w-full rounded-2xl border border-slate/15 bg-white px-4 py-3 text-sm outline-none"
                      placeholder="Usuario"
                    />
                  </div>
                  <div>
                    <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate">
                      <KeyRound className="h-3.5 w-3.5" />
                      Nueva contrasena
                    </p>
                    <input
                      name="password"
                      type="password"
                      minLength={4}
                      className="w-full rounded-2xl border border-slate/15 bg-white px-4 py-3 text-sm outline-none"
                      placeholder="Deja vacio para no cambiarla"
                    />
                  </div>
                  <div className="flex items-end">
                    <button type="submit" className="w-full rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white sm:w-auto">
                      Guardar
                    </button>
                  </div>
                </form>
              </article>
            ))}
          </div>
        )}
      </SectionCard>
    </PageShell>
  );
}
