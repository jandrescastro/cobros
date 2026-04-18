import { ArrowLeft, ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import type { Cliente, Cobro } from "@/lib/types";
import { formatCurrency, monthLabel } from "@/lib/utils";
import { updateCobroStatus } from "@/modules/cobros/actions";

type MonthChargeCardProps = {
  cliente: Cliente;
  cobro: Cobro;
};

export function MonthChargeCard({ cliente, cobro }: MonthChargeCardProps) {
  const isPending = cobro.estado === "pendiente";
  const isPaid = cobro.estado === "pagado";

  return (
    <article
      className={
        isPending
          ? "rounded-card border border-red-200 bg-red-50 p-4 shadow-soft"
          : isPaid
            ? "rounded-card border border-emerald-200 bg-emerald-50 p-4 shadow-soft"
          : "rounded-card border border-white/70 bg-white p-4 shadow-soft"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">{cliente.nombre}</h3>
          <p
            className={
              isPending ? "text-sm text-red-700" : isPaid ? "text-sm text-emerald-700" : "text-sm text-slate"
            }
          >
            {monthLabel(cobro.anio, cobro.mes)}
          </p>
        </div>
        <StatusBadge status={cobro.estado} />
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p
            className={
              isPending ? "text-sm text-red-700" : isPaid ? "text-sm text-emerald-700" : "text-sm text-slate"
            }
          >
            Monto
          </p>
          <p className="text-xl font-semibold">{formatCurrency(cobro.monto)}</p>
        </div>

        <form action={updateCobroStatus}>
          <input type="hidden" name="clienteId" value={cliente.id} />
          <input type="hidden" name="anio" value={String(cobro.anio)} />
          <input type="hidden" name="mes" value={String(cobro.mes)} />
          <input type="hidden" name="monto" value={String(cobro.monto)} />
          <input type="hidden" name="currentStatus" value={cobro.estado} />
          <button
            type="submit"
            className={
              isPending
                ? "inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white"
                : "inline-flex items-center gap-1 rounded-full border border-slate/20 bg-white px-3 py-1.5 text-xs font-semibold text-slate"
            }
          >
            {cobro.estado === "pagado" ? (
              <ArrowLeft className={isPending ? "h-4 w-4" : "h-3.5 w-3.5"} />
            ) : (
              <ArrowRight className={isPending ? "h-4 w-4" : "h-3.5 w-3.5"} />
            )}
            {cobro.estado === "pagado" ? "Revertir pago" : "Marcar pagado"}
          </button>
        </form>
      </div>

      {cobro.observacion ? (
        <p
          className={
            isPending
              ? "mt-3 text-sm text-red-700"
              : isPaid
                ? "mt-3 text-sm text-emerald-700"
                : "mt-3 text-sm text-slate"
          }
        >
          {cobro.observacion}
        </p>
      ) : null}
    </article>
  );
}
