import { PageShell } from "@/components/page-shell";
import { EmptyState } from "@/components/empty-state";
import { requireProfile } from "@/lib/auth";
import { buildCobrosDelMes } from "@/lib/billing";
import { CURRENT_MONTH, CURRENT_YEAR } from "@/lib/mock-data";
import { MonthChargeCard } from "@/modules/cobros/components/month-charge-card";
import { MonthSummaryStrip } from "@/modules/meses/components/month-summary-strip";

type MesPageProps = {
  searchParams?: Promise<{ anio?: string; mes?: string }>;
};

export default async function MesPage({ searchParams }: MesPageProps) {
  const profile = await requireProfile(["collector"]);
  const params = searchParams ? await searchParams : undefined;
  const selectedYear = Number(params?.anio) || CURRENT_YEAR;
  const selectedMonth = Number(params?.mes) || CURRENT_MONTH;
  const items = await buildCobrosDelMes(selectedYear, selectedMonth);

  return (
    <PageShell
      title="Cobros del mes"
      description="Lista operativa para revisar clientes asignados y marcar sus pagos mensuales."
      role={profile.rol}
      viewerName={profile.nombre}
    >
      <MonthSummaryStrip year={selectedYear} month={selectedMonth} />

      {items.length === 0 ? (
        <EmptyState
          title="No hay cobros generados"
          description="Cuando tengas clientes activos asignados veras aqui los cobros del periodo actual."
        />
      ) : (
        items.map(({ cliente, cobro }) => <MonthChargeCard key={cobro.id} cliente={cliente} cobro={cobro} />)
      )}
    </PageShell>
  );
}
