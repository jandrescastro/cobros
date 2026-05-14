import Link from "next/link";
import { Search, X } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageShell } from "@/components/page-shell";
import { requireProfile } from "@/lib/auth";
import { buildCobrosDelMes } from "@/lib/billing";
import { resolveSelectedPeriod } from "@/lib/period";
import { MonthChargeCard } from "@/modules/cobros/components/month-charge-card";
import { MonthSummaryStrip } from "@/modules/meses/components/month-summary-strip";

type MesPageProps = {
  searchParams?: Promise<{ anio?: string; mes?: string; estado?: string; q?: string }>;
};

export default async function MesPage({ searchParams }: MesPageProps) {
  const profile = await requireProfile(["collector"]);
  const params = searchParams ? await searchParams : undefined;
  const { year: selectedYear, month: selectedMonth } = resolveSelectedPeriod(params);
  const selectedEstado = params?.estado;
  const query = params?.q?.trim() ?? "";
  const normalizedQuery = query.toLowerCase();
  const allItems = await buildCobrosDelMes(selectedYear, selectedMonth);
  const statusItems =
    selectedEstado === "pagado"
      ? allItems.filter(({ cobro }) => cobro.estado === "pagado")
      : allItems;
  const items = normalizedQuery
    ? statusItems.filter(({ cliente }) => cliente.nombre.toLowerCase().includes(normalizedQuery))
    : statusItems;
  const title = selectedEstado === "pagado" ? "Clientes que ya pagaron" : "Cobros del mes";
  const description =
    selectedEstado === "pagado"
      ? "Consulta solo los clientes que ya cancelaron el periodo seleccionado."
      : "Lista operativa para revisar clientes asignados y marcar sus pagos mensuales por periodo.";
  const emptyTitle = selectedEstado === "pagado" ? "Aun no hay pagos registrados" : "No hay cobros generados";
  const emptyDescription = query
    ? `No encontramos clientes que coincidan con "${query}" en este periodo.`
    : selectedEstado === "pagado"
      ? "Cuando registres pagos completos en este periodo, apareceran aqui."
      : "Cuando tengas clientes activos asignados veras aqui los cobros del periodo seleccionado.";
  const clearSearchHref = `/mes?anio=${selectedYear}&mes=${selectedMonth}${selectedEstado ? `&estado=${selectedEstado}` : ""}`;

  return (
    <PageShell
      title={title}
      description={description}
      role={profile.rol}
      viewerName={profile.nombre}
    >
      <MonthSummaryStrip year={selectedYear} month={selectedMonth} />

      <form className="rounded-[1.7rem] border border-white/70 bg-white/90 p-2 shadow-soft">
        <input type="hidden" name="anio" value={String(selectedYear)} />
        <input type="hidden" name="mes" value={String(selectedMonth)} />
        {selectedEstado ? <input type="hidden" name="estado" value={selectedEstado} /> : null}
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-[1.1rem] bg-sand/60 px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-slate" />
            <input
              name="q"
              defaultValue={query}
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-slate"
              placeholder="Buscar cliente por nombre"
            />
          </div>
          <button
            type="submit"
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white"
          >
            Buscar
          </button>
          {query ? (
            <Link
              href={clearSearchHref}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate/15 bg-white text-slate"
              aria-label="Limpiar busqueda"
            >
              <X className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </form>

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
