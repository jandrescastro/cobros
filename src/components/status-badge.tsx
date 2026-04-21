import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  status: "pagado" | "pendiente" | "abono" | "activo" | "inactivo";
};

const styles = {
  pagado: "bg-emerald-600 text-white",
  pendiente: "bg-red-600 text-white",
  abono: "bg-amber-500 text-white",
  activo: "bg-ink text-white",
  inactivo: "bg-slate/15 text-slate"
};

const labels = {
  pagado: "Pagado",
  pendiente: "Pendiente",
  abono: "Abono",
  activo: "Activo",
  inactivo: "Inactivo"
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
        styles[status]
      )}
    >
      {labels[status]}
    </span>
  );
}
