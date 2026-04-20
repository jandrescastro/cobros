import { PageShell } from "@/components/page-shell";
import { EmptyState } from "@/components/empty-state";
import { requireProfile } from "@/lib/auth";
import { buildCobrosDelMes } from "@/lib/billing";
import { CURRENT_MONTH, CURRENT_YEAR } from "@/lib/mock-data";
import { MonthChargeCard } from "@/modules/cobros/components/month-charge-card";
import { MonthSummaryStrip } from "@/modules/meses/components/month-summary-strip";

type MesPageProps = {
  searchParams?: Promise<{ anio?: string; mes?: string; estado?: string }>;
};

export default async function MesPage({ searchParams }: MesPageProps) {
  const profile = await requireProfile(["collector"]);
  const params = searchParams ? await searchParams : undefined;
  const selectedYear = Number(params?.anio) || CURRENT_YEAR;
  const selectedMonth = Number(params?.mes) || CURRENT_MONTH;
  const selectedEstado = params?.estado;
  const allItems = await buildCobrosDelMes(selectedYear, selectedMonth);
  const items =
    selectedEstado === "pagado"
      ? allItems.filter(({ cobro }) => cobro.estado === "pagado")
      : allItems;
  const title = selectedEstado === "pagado" ? "Clientes que ya pagaron" : "Cobros del mes";
  const description =
    selectedEstado === "pagado"
      ? "Consulta solo los clientes que ya cancelaron el periodo actual."
      : "Lista operativa para revisar clientes asignados y marcar sus pagos mensuales.";
  const emptyTitle = selectedEstado === "pagado" ? "Aun no hay pagos registrados" : "No hay cobros generados";
  const emptyDescription =
    selectedEstado === "pagado"
      ? "Cuando registres pagos completos en este periodo, apareceran aqui."
      : "Cuando tengas clientes activos asignados veras aqui los cobros del periodo actual.";

  return (
    <PageShell
      title={title}
      description={description}
      role={profile.rol}
      viewerName={profile.nombre}
    >
      <MonthSummaryStrip year={selectedYear} month={selectedMonth} />

      {items.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
        />
      ) : (
        items.map(({ cliente, cobro }) => <MonthChargeCard key={cobro.id} cliente={cliente} cobro={cobro} />)
      )}
    </PageShell>
  );
}
