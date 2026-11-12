import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import type { Cliente } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { deleteCliente } from "@/modules/clientes/actions";

type ClientCardProps = {
  cliente: Cliente;
};

export function ClientCard({ cliente }: ClientCardProps) {
  return (
    <article className="rounded-card border border-white/70 bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">{cliente.nombre}</h3>
          <p className="text-sm text-slate">{cliente.activo ? "Cliente activo para cobro mensual." : "Retirado. Conserva historial y deudas."}</p>
        </div>
        <StatusBadge status={cliente.activo ? "activo" : "inactivo"} />
      </div>

      <div className="mt-4 text-sm">
        <p className="text-slate">Cuota</p>
        <p className="font-medium">{formatCurrency(cliente.cuota_mensual)}</p>
        <p className="mt-3 text-slate">Dia sugerido</p>
        <p className="font-medium">{cliente.dia_cobro_sugerido ? `Dia ${cliente.dia_cobro_sugerido}` : "Sin definir"}</p>
        <p className="mt-3 text-slate">Responsable</p>
        <p className="font-medium">{cliente.responsable_cobro ?? "Sin definir"}</p>
      </div>

      <div className="mt-4 flex gap-2">
        <Link
          href={`/clientes/${cliente.id}`}
          className="inline-flex items-center gap-2 rounded-full bg-sand px-4 py-2 text-sm font-medium text-ink"
        >
          <Pencil className="h-4 w-4" />
          Editar
        </Link>
        <form action={deleteCliente}>
          <input type="hidden" name="cliente_id" value={cliente.id} />
          <button
            type="submit"
            disabled={!cliente.activo}
            title={
              !cliente.activo
                ? "Cliente retirado; su historial se conserva"
                : "Retirar de futuras mensualidades y conservar historial"
            }
            className={
              !cliente.activo
                ? "inline-flex items-center gap-2 rounded-full border border-slate/15 px-4 py-2 text-sm font-medium text-slate/40"
                : "inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600"
            }
          >
            <Trash2 className="h-4 w-4" />
            {cliente.activo ? "Retirar cliente" : "Retirado"}
          </button>
        </form>
      </div>
    </article>
  );
}
