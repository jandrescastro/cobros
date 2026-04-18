import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { PendienteAcumulado } from "@/lib/types";
import { formatCurrency, monthLabel } from "@/lib/utils";

type ArrearsCardProps = {
  item: PendienteAcumulado;
};

export function ArrearsCard({ item }: ArrearsCardProps) {
  return (
    <article className="rounded-card border border-white/70 bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">{item.cliente.nombre}</h3>
          <p className="text-sm text-slate">{item.cantidadPendientes} meses pendientes</p>
        </div>
        <p className="text-lg font-semibold">{formatCurrency(item.totalPendiente)}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {item.mesesPendientes.map((cobro) => (
          <span key={cobro.id} className="rounded-full bg-sand px-3 py-1 text-xs font-medium text-ink">
            {monthLabel(cobro.anio, cobro.mes)}
          </span>
        ))}
      </div>

      <Link
        href={`/clientes/${item.cliente.id}`}
        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-ink"
      >
        Ver historial
        <ChevronRight className="h-4 w-4" />
      </Link>
    </article>
  );
}
