import { Plus } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageShell } from "@/components/page-shell";
import { requireProfile } from "@/lib/auth";
import { getClientes } from "@/lib/billing";
import { ClientCard } from "@/modules/clientes/components/client-card";
import { ClientFormCard } from "@/modules/clientes/components/client-form-card";

export default async function ClientesPage() {
  const profile = await requireProfile(["collector"]);
  const clientes = await getClientes();

  return (
    <PageShell
      title="Clientes"
      description="Crea clientes nuevos, entra al detalle de cada uno y administra los cobros de la cartera compartida."
      role={profile.rol}
      viewerName={profile.nombre}
      actions={undefined}
    >
      <ClientFormCard />
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
