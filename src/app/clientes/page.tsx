import { Plus } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageShell } from "@/components/page-shell";
import { requireProfile } from "@/lib/auth";
import { getClientes } from "@/lib/billing";
import { ClientCard } from "@/modules/clientes/components/client-card";
import { ClientFormCard } from "@/modules/clientes/components/client-form-card";

type ClientesPageProps = {
  searchParams?: Promise<{ error?: string; deleted?: string }>;
};

const errorMessages: Record<string, string> = {
  servidor: "No fue posible conectar con Supabase para borrar el cliente.",
  cliente: "No pudimos identificar el cliente que querias borrar.",
  pagos: "No pudimos validar si el cliente ya tiene pagos registrados.",
  "pagos-realizados": "No puedes borrar clientes que ya tuvieron pagos o abonos registrados.",
  eliminar: "No fue posible borrar el cliente seleccionado."
};

export default async function ClientesPage({ searchParams }: ClientesPageProps) {
  const profile = await requireProfile(["collector"]);
  const clientes = await getClientes();
  const params = searchParams ? await searchParams : undefined;
  const feedback = params?.error ? errorMessages[params.error] ?? "Ocurrio un error inesperado." : null;
  const deleted = params?.deleted === "1";

  return (
    <PageShell
      title="Clientes"
      description="Crea clientes nuevos, entra al detalle de cada uno y administra los cobros de la cartera compartida."
      role={profile.rol}
      viewerName={profile.nombre}
      actions={undefined}
    >
      <ClientFormCard />
      {feedback ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{feedback}</p> : null}
      {deleted ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Cliente borrado correctamente.</p> : null}
      {clientes.length === 0 ? (
        <EmptyState
          title="Todavia no hay clientes"
          description="Usa el formulario superior para crear el primer cliente de la cartera compartida."
        />
      ) : (
        clientes.map((cliente) => <ClientCard key={cliente.id} cliente={cliente} />)
      )}
    </PageShell>
  );
}
