import { Plus } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageShell } from "@/components/page-shell";
import { requireProfile } from "@/lib/auth";
import { getClientes } from "@/lib/billing";
import { ClientCard } from "@/modules/clientes/components/client-card";

export default async function ClientesPage() {
  const profile = await requireProfile(["collector"]);
  const clientes = await getClientes();

  return (
    <PageShell
      title="Clientes"
      description="Consulta tus clientes asignados y entra al detalle de cada uno sin salir del flujo de cobro."
      role={profile.rol}
      viewerName={profile.nombre}
      actions={undefined}
    >
      {clientes.length === 0 ? (
        <EmptyState
          title="Sin clientes asignados"
          description="Cuando un administrador te asigne clientes, apareceran aqui automaticamente."
        />
      ) : (
        clientes.map((cliente) => <ClientCard key={cliente.id} cliente={cliente} />)
      )}
    </PageShell>
  );
}
