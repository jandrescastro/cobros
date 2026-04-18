import Link from "next/link";
import { Pencil, Phone } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import type { Cliente } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

type ClientCardProps = {
  cliente: Cliente;
};

export function ClientCard({ cliente }: ClientCardProps) {
  return (
    <article className="rounded-card border border-white/70 bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">{cliente.nombre}</h3>
          <p className="text-sm text-slate">{cliente.direccion}</p>
        </div>
        <StatusBadge status={cliente.activo ? "activo" : "inactivo"} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-slate">Teléfono</p>
          <p className="font-medium">{cliente.telefono}</p>
        </div>
        <div>
          <p className="text-slate">Cuota</p>
          <p className="font-medium">{formatCurrency(cliente.cuota_mensual)}</p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Link
          href={`/clientes/${cliente.id}`}
          className="inline-flex items-center gap-2 rounded-full bg-sand px-4 py-2 text-sm font-medium text-ink"
        >
          <Pencil className="h-4 w-4" />
          Editar
        </Link>
        <a
          href={`tel:${cliente.telefono.replace(/\s+/g, "")}`}
          className="inline-flex items-center gap-2 rounded-full border border-slate/15 px-4 py-2 text-sm font-medium text-slate"
        >
          <Phone className="h-4 w-4" />
          Llamar
        </a>
      </div>
    </article>
  );
}
