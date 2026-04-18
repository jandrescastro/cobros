import { ShieldPlus, UserPlus } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageShell } from "@/components/page-shell";
import { SectionCard } from "@/components/section-card";
import { requireProfile } from "@/lib/auth";
import { getAdminUserManagementData } from "@/lib/admin";
import { createManagedUser } from "@/modules/auth/actions";

type AdminUsersPageProps = {
  searchParams?: Promise<{ error?: string; created?: string }>;
};

const errorMessages: Record<string, string> = {
  "service-role": "Falta SUPABASE_SERVICE_ROLE_KEY en .env.local para poder crear usuarios.",
  datos: "Revisa nombre, correo y contrasena. La contrasena debe tener al menos 8 caracteres.",
  "crear-usuario": "No pudimos crear el usuario en Supabase Auth.",
  perfil: "El usuario se creo en Auth, pero fallo la creacion del perfil.",
  asignaciones: "No fue posible guardar los clientes asignados."
};

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const profile = await requireProfile(["admin"]);
  const { clientes, usuarios, serviceRoleConfigured } = await getAdminUserManagementData();
  const params = searchParams ? await searchParams : undefined;
  const feedback = params?.error ? errorMessages[params.error] ?? "Ocurrio un error inesperado." : null;
  const success = params?.created === "1";

  return (
    <PageShell
      title="Usuarios"
      description="Crea usuarios y define exactamente que clientes puede ver cada uno."
      role={profile.rol}
      viewerName={profile.nombre}
    >
      <SectionCard title="Nuevo usuario" subtitle="Cada cuenta entra con correo y contrasena propias" action={<UserPlus className="h-5 w-5 text-ink" />}>
        {!serviceRoleConfigured ? (
          <EmptyState
            title="Falta la service role key"
            description="Agrega SUPABASE_SERVICE_ROLE_KEY en .env.local para habilitar la creacion de usuarios desde esta pantalla."
          />
        ) : null}

        {feedback ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{feedback}</p> : null}
        {success ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Usuario creado correctamente.</p> : null}

        <form action={createManagedUser} className="space-y-3">
          <input name="nombre" required className="w-full rounded-2xl border border-slate/15 px-4 py-3 text-sm outline-none" placeholder="Nombre del usuario" />
          <input name="email" type="email" required className="w-full rounded-2xl border border-slate/15 px-4 py-3 text-sm outline-none" placeholder="Correo" />
          <input name="password" type="password" required className="w-full rounded-2xl border border-slate/15 px-4 py-3 text-sm outline-none" placeholder="Contrasena temporal" />

          <div className="rounded-2xl border border-slate/15 bg-sand/60 p-4">
            <p className="text-sm font-semibold text-ink">Clientes asignados</p>
            <p className="mt-1 text-sm text-slate">Marca solo los clientes que este usuario podra consultar y cobrar.</p>
            <div className="mt-3 space-y-2">
              {clientes.length === 0 ? (
                <p className="text-sm text-slate">No hay clientes creados todavia.</p>
              ) : (
                clientes.map((cliente) => (
                  <label key={cliente.id} className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2 text-sm text-ink">
                    <input type="checkbox" name="cliente_ids" value={cliente.id} className="h-4 w-4 accent-ink" />
                    <span className="flex-1">{cliente.nombre}</span>
                    <span className="text-slate">${cliente.cuota_mensual.toLocaleString("es-CO")}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <button type="submit" className="w-full rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white" disabled={!serviceRoleConfigured}>
            Crear usuario
          </button>
        </form>
      </SectionCard>

      <SectionCard title="Usuarios creados" subtitle="Vista rapida de sus carteras" action={<ShieldPlus className="h-5 w-5 text-ink" />}>
        {usuarios.length === 0 ? (
          <EmptyState title="Aun no hay usuarios" description="Crea el primer usuario y asignale sus clientes desde el formulario superior." />
        ) : (
          <div className="space-y-3">
            {usuarios.map((usuario) => (
              <article key={usuario.id} className="rounded-2xl border border-slate/10 bg-white px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{usuario.nombre}</p>
                    <p className="text-sm text-slate">{usuario.email}</p>
                  </div>
                  <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-ink">
                    {usuario.clientesAsignados.length} clientes
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {usuario.clientesAsignados.length === 0 ? (
                    <span className="text-sm text-slate">Sin clientes asignados aun.</span>
                  ) : (
                    usuario.clientesAsignados.map((clienteId) => {
                      const cliente = clientes.find((item) => item.id === clienteId);
                      return (
                        <span key={clienteId} className="rounded-full bg-sand px-3 py-1 text-xs font-medium text-ink">
                          {cliente?.nombre ?? clienteId}
                        </span>
                      );
                    })
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionCard>
    </PageShell>
  );
}
