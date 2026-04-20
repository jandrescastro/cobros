import Link from "next/link";
import { ArrowRight, CircleDollarSign, CreditCard, TriangleAlert, Users } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { requireProfile } from "@/lib/auth";
import { buildCobrosDelMes, getPendientesAcumulados, getResumenDashboard } from "@/lib/billing";
import { formatCurrency } from "@/lib/utils";
import { MonthSummaryStrip } from "@/modules/meses/components/month-summary-strip";
import { CURRENT_MONTH, CURRENT_YEAR } from "@/lib/mock-data";

type DashboardPageProps = {
  searchParams?: Promise<{ anio?: string; mes?: string }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const profile = await requireProfile(["collector"]);
  const params = searchParams ? await searchParams : undefined;
  const selectedYear = Number(params?.anio) || CURRENT_YEAR;
  const selectedMonth = Number(params?.mes) || CURRENT_MONTH;
  const resumen = await getResumenDashboard(selectedYear, selectedMonth);
  const cobrosDelMesCompletos = await buildCobrosDelMes(selectedYear, selectedMonth);
  const cobrosDelMes = cobrosDelMesCompletos.slice(0, 3);
  const clientesQuePagaron = cobrosDelMesCompletos.filter(({ cobro }) => cobro.estado === "pagado").length;
  const pendientes = (await getPendientesAcumulados()).slice(0, 3);

  return (
    <PageShell
      title="Mensualidades"
      role={profile.rol}
      viewerName={profile.nombre}
    >
      <MonthSummaryStrip year={selectedYear} month={selectedMonth} />

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Cobrado"
          value={formatCurrency(resumen.montoCobrado)}
          hint="Ingresos del mes"
          icon={<CircleDollarSign className="h-4.5 w-4.5 text-emerald-700" />}
          tone="success"
        />
        <StatCard
          label="Pendiente"
          value={formatCurrency(resumen.montoPendiente)}
          hint={`${resumen.clientesPendientes} clientes del mes`}
          icon={<TriangleAlert className="h-4.5 w-4.5 text-red-600" />}
          tone="warning"
        />
        <StatCard
          label="Activos"
          value={String(resumen.totalClientesActivos)}
          hint="Clientes con cobro mensual"
          icon={<Users className="h-4.5 w-4.5 text-ink" />}
        />
        <StatCard
          label="Ya pagaron"
          value={String(clientesQuePagaron)}
          hint="Clientes al dia en este periodo"
          icon={<CreditCard className="h-4.5 w-4.5 text-ink" />}
          href={`/mes?anio=${selectedYear}&mes=${selectedMonth}&estado=pagado`}
        />
      </div>

      <SectionCard
        title="Cobros del mes"
        subtitle="Acceso rapido al flujo principal"
        action={
          <Link href="/mes" className="text-sm font-semibold text-ink">
            Ver todo
          </Link>
        }
      >
        <div className="space-y-3">
          {cobrosDelMes.map(({ cliente, cobro }) => (
            <div
              key={cobro.id}
              className={
                cobro.estado === "pendiente"
                  ? "flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 px-4 py-3"
                  : cobro.estado === "abono"
                    ? "flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3"
                    : "flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3"
              }
            >
              <div>
                <p className="font-medium">{cliente.nombre}</p>
                <p
                  className={
                    cobro.estado === "pendiente"
                      ? "text-sm text-red-700"
                      : cobro.estado === "abono"
                        ? "text-sm text-amber-700"
                        : "text-sm text-emerald-700"
                  }
                >
                  {formatCurrency(cobro.estado === "pagado" ? cobro.monto_original : cobro.monto)}
                </p>
              </div>
              <span
                className={
                  cobro.estado === "pendiente"
                    ? "text-sm font-semibold uppercase tracking-wide text-red-600"
                    : cobro.estado === "abono"
                      ? "text-sm font-semibold uppercase tracking-wide text-amber-700"
                      : "text-sm font-semibold uppercase tracking-wide text-emerald-700"
                }
              >
                {cobro.estado}
              </span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Pendientes acumulados"
        subtitle="Arrastre de meses anteriores por cliente"
        action={
          <Link href="/pendientes" className="inline-flex items-center gap-1 text-sm font-semibold text-ink">
            Abrir
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      >
        <div className="space-y-3">
          {pendientes.map((item) => (
            <div key={item.cliente.id} className="rounded-2xl border border-slate/10 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{item.cliente.nombre}</p>
                <p className="text-sm font-semibold text-ink">{formatCurrency(item.totalPendiente)}</p>
              </div>
              <p className="mt-1 text-sm text-slate">{item.cantidadPendientes} cobros sin pagar</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </PageShell>
  );
}
