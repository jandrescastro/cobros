import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, History, Phone, Wallet } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { requireProfile } from "@/lib/auth";
import { getClienteById, getHistoricoCliente, getPendientesAcumulados } from "@/lib/billing";
import { formatCurrency, monthLabel } from "@/lib/utils";
import { updateCobroStatus } from "@/modules/cobros/actions";

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
      description="Ficha del cliente con historial y pendientes acumulados dentro de tu cartera asignada."
      role={profile.rol}
      viewerName={profile.nombre}
      actions={
        <Link href="/clientes" className="inline-flex rounded-full bg-white px-3 py-2 text-sm font-medium text-ink shadow-soft">
          <ArrowLeft className="h-4 w-4" />
        </Link>
      }
    >
      <SectionCard title="Resumen" subtitle={cliente.direccion}>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <StatusBadge status={cliente.activo ? "activo" : "inactivo"} />
            <p className="text-lg font-semibold">{formatCurrency(cliente.cuota_mensual)}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-sand p-3">
              <div className="mb-2 flex items-center gap-2 text-slate">
                <Phone className="h-4 w-4" />
                Contacto
              </div>
              <p className="font-medium text-ink">{cliente.telefono}</p>
            </div>
            <div className="rounded-2xl bg-sand p-3">
              <div className="mb-2 flex items-center gap-2 text-slate">
                <Wallet className="h-4 w-4" />
                Pendiente
              </div>
              <p className="font-medium text-ink">
                {deudaActual ? formatCurrency(deudaActual.totalPendiente) : formatCurrency(0)}
              </p>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Historial" subtitle="Cobros mensuales y arrastre de deuda">
        <div className="space-y-3">
          {historial.map(({ cobro, esArrastre }) => (
            <div key={cobro.id} className="rounded-2xl border border-slate/10 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{monthLabel(cobro.anio, cobro.mes)}</p>
                  <p className="text-sm text-slate">{formatCurrency(cobro.monto)}</p>
                </div>
                <StatusBadge status={cobro.estado} />
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs uppercase tracking-wide text-slate">
                <History className="h-3.5 w-3.5" />
                {esArrastre ? "Arrastrado a meses siguientes" : "Periodo normal"}
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="text-sm text-slate">
                  {cobro.estado === "pendiente"
                    ? "Puedes cobrar esta mensualidad desde aqui."
                    : cobro.fecha_pago
                      ? `Pagado el ${cobro.fecha_pago}`
                      : "Pago registrado"}
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
                      cobro.estado === "pendiente"
                        ? "inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white"
                        : "inline-flex items-center gap-1 rounded-full border border-slate/20 bg-white px-3 py-1.5 text-xs font-semibold text-slate"
                    }
                  >
                    {cobro.estado === "pendiente" ? <ArrowRight className="h-3.5 w-3.5" /> : <ArrowLeft className="h-3.5 w-3.5" />}
                    {cobro.estado === "pendiente" ? "Marcar pagado" : "Revertir"}
                  </button>
                </form>
              </div>
              {cobro.observacion ? <p className="mt-2 text-sm text-slate">{cobro.observacion}</p> : null}
            </div>
          ))}
        </div>
      </SectionCard>
    </PageShell>
  );
}
