import { BarChart3, CircleDollarSign, TriangleAlert } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { requireProfile } from "@/lib/auth";
import { getMetricasMensuales, getResumenDashboard } from "@/lib/billing";
import { CURRENT_MONTH, CURRENT_YEAR } from "@/lib/mock-data";
import { formatCurrency, getMonthOptions } from "@/lib/utils";
import { MonthSummaryStrip } from "@/modules/meses/components/month-summary-strip";

type MetricasPageProps = {
  searchParams?: Promise<{ anio?: string; mes?: string }>;
};

export default async function MetricasPage({ searchParams }: MetricasPageProps) {
  const profile = await requireProfile(["collector"]);
  const params = searchParams ? await searchParams : undefined;
  const selectedYear = Number(params?.anio) || CURRENT_YEAR;
  const selectedMonth = Number(params?.mes) || CURRENT_MONTH;
  const resumen = await getResumenDashboard(selectedYear, selectedMonth);
  const metricas = await getMetricasMensuales(selectedYear);
  const maxMonto = Math.max(...metricas.map((item) => item.montoCobrado + item.montoPendiente), 1);
  const meses = getMonthOptions();

  return (
    <PageShell
      title="Metricas"
      description="Revisa cuanto has cobrado y cuanto queda pendiente por cada mes dentro de tus clientes asignados."
      role={profile.rol}
      viewerName={profile.nombre}
    >
      <MonthSummaryStrip year={selectedYear} month={selectedMonth} />

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Cobrado"
          value={formatCurrency(resumen.montoCobrado)}
          hint="Recaudado en el mes elegido"
          icon={<CircleDollarSign className="h-4 w-4 text-emerald-700" />}
          tone="success"
        />
        <StatCard
          label="Pendiente"
          value={formatCurrency(resumen.montoPendiente)}
          hint={`${resumen.clientesPendientes} clientes por cobrar`}
          icon={<TriangleAlert className="h-4 w-4 text-red-600" />}
          tone="warning"
        />
      </div>

      <SectionCard
        title="Recaudo por mes"
        subtitle={`Comparativo mensual del ano ${selectedYear}`}
        action={<BarChart3 className="h-5 w-5 text-ink" />}
      >
        <div className="space-y-4">
          {metricas.map((item) => {
            const total = item.montoCobrado + item.montoPendiente;
            const width = `${Math.max((total / maxMonto) * 100, total > 0 ? 12 : 0)}%`;
            const selected = item.mes === selectedMonth;
            const mesLabel = meses.find((mes) => mes.value === item.mes)?.shortLabel ?? String(item.mes);

            return (
              <div key={`${item.anio}-${item.mes}`} className={selected ? "rounded-2xl border border-ink/15 bg-sand p-3" : ""}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="font-display text-sm font-bold uppercase tracking-[0.08em] text-ink">{mesLabel}</p>
                  <p className="text-xs text-slate">
                    {formatCurrency(item.montoCobrado)} / {formatCurrency(total)}
                  </p>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate/10">
                  <div className="flex h-full" style={{ width }}>
                    <div className="h-full bg-emerald-600" style={{ width: total > 0 ? `${(item.montoCobrado / total) * 100}%` : "0%" }} />
                    <div className="h-full bg-red-500" style={{ width: total > 0 ? `${(item.montoPendiente / total) * 100}%` : "0%" }} />
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs text-slate">
                  <span>Cobrado: {formatCurrency(item.montoCobrado)}</span>
                  <span>Pendiente: {formatCurrency(item.montoPendiente)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </PageShell>
  );
}
