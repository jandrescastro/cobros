import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, History, Save, Wallet } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { requireProfile } from "@/lib/auth";
import { getClienteById, getHistoricoCliente, getPendientesAcumulados } from "@/lib/billing";
import { formatCurrency, monthLabel } from "@/lib/utils";
import { updateCobroMonto, updateCobroStatus } from "@/modules/cobros/actions";
import { updateCliente } from "@/modules/clientes/actions";
import { DayCardPicker } from "@/modules/clientes/components/day-card-picker";

type ClienteDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ClienteDetailPage({ params }: ClienteDetailPageProps) {
  const profile = await requireProfile(["collector"]);
  const { id } = await params;
  const cliente = await getClienteById(id);

  if (!cliente) {
    notFound();
  }

  const historial = await getHistoricoCliente(id);
  const deudaActual = (await getPendientesAcumulados()).find((item) => item.cliente.id === id);

  return (
    <PageShell
      title={cliente.nombre}
      description="Ficha del cliente con historial, datos principales y pendientes acumulados dentro de la cartera compartida."
      role={profile.rol}
      viewerName={profile.nombre}
      actions={
        <Link href="/clientes" className="inline-flex rounded-full bg-white px-3 py-2 text-sm font-medium text-ink shadow-soft">
          <ArrowLeft className="h-4 w-4" />
        </Link>
      }
    >
      <SectionCard title="Resumen" subtitle="Actualiza los datos principales de este cliente">
        <form action={updateCliente} className="space-y-4">
          <input type="hidden" name="cliente_id" value={cliente.id} />

          <div className="flex items-center justify-between gap-3">
            <StatusBadge status={cliente.activo ? "activo" : "inactivo"} />
            <div className="rounded-2xl bg-sand px-4 py-3 text-right">
              <div className="mb-1 flex items-center justify-end gap-2 text-slate">
                <Wallet className="h-4 w-4" />
                Pendiente
              </div>
              <p className="font-semibold text-ink">
                {deudaActual ? formatCurrency(deudaActual.totalPendiente) : formatCurrency(0)}
              </p>
            </div>
          </div>

          <input
            name="nombre"
            required
            defaultValue={cliente.nombre}
            className="w-full rounded-2xl border border-slate/15 px-4 py-3 text-sm outline-none"
            placeholder="Nombre completo"
          />

          <div className="rounded-2xl bg-sand p-3">
            <div className="mb-2 flex items-center gap-2 text-slate">
              <Wallet className="h-4 w-4" />
              Cuota mensual
            </div>
            <input
              name="cuota_mensual"
              type="text"
              inputMode="numeric"
              required
              defaultValue={cliente.cuota_mensual.toLocaleString("es-CO")}
              className="w-full rounded-2xl border border-slate/15 bg-white px-4 py-3 text-sm outline-none"
              placeholder="Cuota mensual"
            />
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl bg-sand p-3">
              <div className="mb-3 flex items-center gap-2 text-slate">
                <Wallet className="h-4 w-4" />
                Dia sugerido de cobro
              </div>
              <DayCardPicker name="dia_cobro_sugerido" selectedDay={cliente.dia_cobro_sugerido} required />
            </div>

            <div className="rounded-2xl bg-sand p-3 sm:max-w-xs">
              <div className="mb-2 flex items-center gap-2 text-slate">
                <Wallet className="h-4 w-4" />
                Responsable
              </div>
              <select
                name="responsable_cobro"
                required
                defaultValue={cliente.responsable_cobro ?? "JOSE"}
                className="w-full rounded-2xl border border-slate/15 bg-white px-4 py-3 text-sm outline-none"
              >
                <option value="JOSE">JOSE</option>
                <option value="HECTOR">HECTOR</option>
              </select>
            </div>
          </div>

          <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white">
            <Save className="h-4 w-4" />
            Guardar cambios
          </button>
        </form>
      </SectionCard>

      <SectionCard title="Historial" subtitle="Cobros mensuales y arrastre de deuda">
        <div className="space-y-3">
          {historial.map(({ cobro, esArrastre }) => (
            <div key={cobro.id} className="rounded-2xl border border-slate/10 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{monthLabel(cobro.anio, cobro.mes)}</p>
                  <p className="text-sm text-slate">
                    Total {formatCurrency(cobro.monto_original)} · Abonado {formatCurrency(cobro.monto_abonado)} · Saldo{" "}
                    {formatCurrency(cobro.estado === "pagado" ? 0 : cobro.monto)}
                  </p>
                </div>
                <StatusBadge status={cobro.estado} />
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs uppercase tracking-wide text-slate">
                <History className="h-3.5 w-3.5" />
                {esArrastre ? "Arrastrado a meses siguientes" : "Periodo normal"}
              </div>
              <div className="mt-3 space-y-3">
                <div className="text-sm text-slate">
                  {cobro.estado === "pagado"
                    ? cobro.fecha_pago
                      ? `Pagado el ${cobro.fecha_pago}`
                      : "Pago registrado"
                    : cobro.estado === "abono"
                      ? "Puedes registrar otro abono o completar el pago total."
                      : "Puedes editar el valor pendiente o cobrar esta mensualidad desde aqui."}
                </div>

                <form action={updateCobroMonto} className="flex items-center gap-2">
                  <input type="hidden" name="clienteId" value={cliente.id} />
                  <input type="hidden" name="anio" value={String(cobro.anio)} />
                  <input type="hidden" name="mes" value={String(cobro.mes)} />
                  <input type="hidden" name="currentStatus" value={cobro.estado} />
                  <input type="hidden" name="montoOriginal" value={String(cobro.monto_original)} />
                  <input type="hidden" name="montoAbonado" value={String(cobro.monto_abonado)} />
                  <input
                    name="monto"
                    type="text"
                    inputMode="numeric"
                    defaultValue={(cobro.estado === "pagado" ? 0 : cobro.monto).toLocaleString("es-CO")}
                    className="w-full rounded-full border border-slate/15 bg-white px-4 py-2 text-sm outline-none"
                    placeholder="Saldo pendiente"
                  />
                  <button type="submit" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-sand text-ink">
                    <Save className="h-4 w-4" />
                  </button>
                </form>

                <div className="flex justify-end">
                  <form action={updateCobroStatus} className="space-y-2">
                    <input type="hidden" name="clienteId" value={cliente.id} />
                    <input type="hidden" name="anio" value={String(cobro.anio)} />
                    <input type="hidden" name="mes" value={String(cobro.mes)} />
                    <input type="hidden" name="monto" value={String(cobro.monto)} />
                    <input type="hidden" name="montoOriginal" value={String(cobro.monto_original)} />
                    <input type="hidden" name="montoAbonado" value={String(cobro.monto_abonado)} />
                    <input type="hidden" name="currentStatus" value={cobro.estado} />
                    {cobro.estado === "pagado" ? null : (
                      <>
                        <select
                          name="paymentType"
                          defaultValue={cobro.estado === "abono" ? "abono" : "total"}
                          className="w-full rounded-full border border-slate/15 bg-white px-4 py-2 text-sm outline-none"
                        >
                          <option value="total">Pago total</option>
                          <option value="abono">Realizo abono</option>
                        </select>
                        <input
                          name="paymentAmount"
                          type="text"
                          inputMode="numeric"
                          defaultValue={cobro.monto.toLocaleString("es-CO")}
                          className="w-full rounded-full border border-slate/15 bg-white px-4 py-2 text-sm outline-none"
                          placeholder="Valor del abono"
                        />
                      </>
                    )}
                    <button
                      type="submit"
                      className={
                        cobro.estado !== "pagado"
                          ? "inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white"
                          : "inline-flex items-center gap-1 rounded-full border border-slate/20 bg-white px-3 py-1.5 text-xs font-semibold text-slate"
                      }
                    >
                      {cobro.estado !== "pagado" ? <ArrowRight className="h-3.5 w-3.5" /> : <ArrowLeft className="h-3.5 w-3.5" />}
                      {cobro.estado !== "pagado" ? "Guardar pago" : "Revertir"}
                    </button>
                  </form>
                </div>
              </div>
              {cobro.observacion ? <p className="mt-2 text-sm text-slate">{cobro.observacion}</p> : null}
            </div>
          ))}
        </div>
      </SectionCard>
    </PageShell>
  );
}
