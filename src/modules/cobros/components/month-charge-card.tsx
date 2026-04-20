import { ArrowLeft, ArrowRight, Save } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import type { Cliente, Cobro } from "@/lib/types";
import { formatCurrency, monthLabel } from "@/lib/utils";
import { updateCobroMonto, updateCobroStatus } from "@/modules/cobros/actions";

type MonthChargeCardProps = {
  cliente: Cliente;
  cobro: Cobro;
};

export function MonthChargeCard({ cliente, cobro }: MonthChargeCardProps) {
  const isPending = cobro.estado === "pendiente";
  const isPaid = cobro.estado === "pagado";
  const isAbono = cobro.estado === "abono";
  const saldoPendiente = isPaid ? 0 : cobro.monto;

  const containerClass = isPending
    ? "rounded-card border border-red-200 bg-red-50 p-3 shadow-soft"
    : isAbono
      ? "rounded-card border border-amber-200 bg-amber-50 p-3 shadow-soft"
      : "rounded-card border border-emerald-200 bg-emerald-50 p-3 shadow-soft";

  const toneClass = isPending
    ? "text-red-700"
    : isAbono
      ? "text-amber-700"
      : "text-emerald-700";
  const normalizedObservation = cobro.observacion?.trim().toLowerCase() ?? "";
  const showObservation =
    Boolean(cobro.observacion) && !normalizedObservation.includes("cobro inicial generado al crear el cliente");

  return (
    <article className={containerClass}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold leading-tight">{cliente.nombre}</h3>
            <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-semibold text-slate">
              {cliente.dia_cobro_sugerido ? `Dia ${cliente.dia_cobro_sugerido}` : "Sin dia"}
            </span>
            <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-semibold text-slate">
              {cliente.responsable_cobro ?? "Sin responsable"}
            </span>
          </div>
          <p className={`mt-1 text-xs ${toneClass}`}>{monthLabel(cobro.anio, cobro.mes)}</p>
        </div>
        <StatusBadge status={cobro.estado} />
      </div>

      <div className="mt-2 grid grid-cols-3 gap-1.5 rounded-2xl bg-white/80 p-2 text-[11px]">
        <div>
          <p className="text-slate">Total</p>
          <p className="text-[0.95rem] font-semibold">{formatCurrency(cobro.monto_original)}</p>
        </div>
        <div>
          <p className="text-slate">Abonado</p>
          <p className={`text-[0.95rem] font-semibold ${isAbono ? "text-amber-700" : isPaid ? "text-emerald-700" : "text-ink"}`}>
            {formatCurrency(cobro.monto_abonado)}
          </p>
        </div>
        <div>
          <p className="text-slate">Saldo</p>
          <p className={`text-[0.95rem] font-semibold ${toneClass}`}>{formatCurrency(saldoPendiente)}</p>
        </div>
      </div>

      <div className="mt-2 grid gap-1.5">
        <form action={updateCobroMonto} className="grid grid-cols-[1fr_auto] items-end gap-1.5 rounded-2xl bg-white/70 p-1.5">
          <input type="hidden" name="clienteId" value={cliente.id} />
          <input type="hidden" name="anio" value={String(cobro.anio)} />
          <input type="hidden" name="mes" value={String(cobro.mes)} />
          <input type="hidden" name="currentStatus" value={cobro.estado} />
          <input type="hidden" name="montoOriginal" value={String(cobro.monto_original)} />
          <input type="hidden" name="montoAbonado" value={String(cobro.monto_abonado)} />
          <div className="flex-1">
            <p className={`mb-1 text-[11px] ${toneClass}`}>Saldo pendiente</p>
            <input
              name="monto"
              type="text"
              inputMode="numeric"
              defaultValue={saldoPendiente.toLocaleString("es-CO")}
              className="w-full rounded-2xl border border-slate/15 bg-white px-3 py-1.5 text-sm font-semibold outline-none"
              placeholder="Monto"
            />
          </div>
          <button type="submit" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-ink shadow-soft">
            <Save className="h-3 w-3" />
          </button>
        </form>

        <form action={updateCobroStatus} className="grid gap-1.5 rounded-2xl bg-white/75 p-1.5">
          <input type="hidden" name="clienteId" value={cliente.id} />
          <input type="hidden" name="anio" value={String(cobro.anio)} />
          <input type="hidden" name="mes" value={String(cobro.mes)} />
          <input type="hidden" name="monto" value={String(cobro.monto)} />
          <input type="hidden" name="montoOriginal" value={String(cobro.monto_original)} />
          <input type="hidden" name="montoAbonado" value={String(cobro.monto_abonado)} />
          <input type="hidden" name="currentStatus" value={cobro.estado} />

          {isPaid ? null : (
            <div className="grid gap-1.5 md:grid-cols-[0.9fr_1fr_auto]">
              <div>
                <p className="mb-1 text-[11px] text-slate">Registrar como</p>
                <select
                  name="paymentType"
                  defaultValue={isAbono ? "abono" : "total"}
                  className="w-full rounded-2xl border border-slate/15 bg-white px-3 py-1.5 text-sm outline-none"
                >
                  <option value="total">Pago total</option>
                  <option value="abono">Realizo abono</option>
                </select>
              </div>
              <div>
                <p className="mb-1 text-[11px] text-slate">Valor del abono</p>
                <input
                  name="paymentAmount"
                  type="text"
                  inputMode="numeric"
                  defaultValue={saldoPendiente.toLocaleString("es-CO")}
                  className="w-full rounded-2xl border border-slate/15 bg-white px-3 py-1.5 text-sm outline-none"
                  placeholder="Solo si fue abono"
                />
              </div>
              <div className="flex items-end justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-[11px] font-semibold text-white"
                >
                  <ArrowRight className="h-3 w-3" />
                  Guardar
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              className={
                isPaid
                  ? "inline-flex items-center gap-1 rounded-full border border-slate/20 bg-white px-3 py-1.5 text-xs font-semibold text-slate"
                  : "hidden"
              }
            >
              {isPaid ? <ArrowLeft className="h-3.5 w-3.5" /> : <ArrowRight className="h-4 w-4" />}
              {isPaid ? "Revertir pago" : "Guardar pago"}
            </button>
          </div>
        </form>
      </div>

      {showObservation ? <p className={`mt-1.5 text-[11px] ${toneClass}`}>{cobro.observacion}</p> : null}
    </article>
  );
}
