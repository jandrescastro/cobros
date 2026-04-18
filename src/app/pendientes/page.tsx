import { PageShell } from "@/components/page-shell";
import { EmptyState } from "@/components/empty-state";
import { requireProfile } from "@/lib/auth";
import { getPendientesAcumulados } from "@/lib/billing";
import { ArrearsCard } from "@/modules/pendientes/components/arrears-card";

export default async function PendientesPage() {
  const profile = await requireProfile(["collector"]);
  const pendientes = await getPendientesAcumulados();

  return (
    <PageShell
      title="Pendientes"
      description="Consulta la deuda acumulada de tus clientes asignados y manten visibles los cobros arrastrados."
      role={profile.rol}
      viewerName={profile.nombre}
    >
      {pendientes.length === 0 ? (
        <EmptyState
          title="Sin pendientes"
          description="Cuando todos tus clientes esten al dia, este panel quedara limpio."
        />
      ) : (
        pendientes.map((item) => <ArrearsCard key={item.cliente.id} item={item} />)
      )}
    </PageShell>
  );
}
