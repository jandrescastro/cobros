import { Plus } from "lucide-react";
import { createCliente } from "@/modules/clientes/actions";

export function ClientFormCard() {
  return (
    <section className="rounded-card border border-dashed border-ink/20 bg-white/80 p-4 shadow-soft">
      <div className="mb-4 flex items-center gap-2">
        <span className="rounded-full bg-ink p-2 text-white">
          <Plus className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">Agregar cliente</h2>
          <p className="text-sm text-slate">Crea un cliente nuevo y actívalo para el cobro mensual.</p>
        </div>
      </div>

      <form action={createCliente} className="space-y-3">
        <input
          name="nombre"
          required
          className="w-full rounded-2xl border border-slate/15 px-4 py-3 text-sm outline-none"
          placeholder="Nombre completo"
        />
        <input
          name="telefono"
          required
          className="w-full rounded-2xl border border-slate/15 px-4 py-3 text-sm outline-none"
          placeholder="Teléfono"
        />
        <input
          name="direccion"
          required
          className="w-full rounded-2xl border border-slate/15 px-4 py-3 text-sm outline-none"
          placeholder="Dirección"
        />
        <input
          name="cuota_mensual"
          type="number"
          inputMode="numeric"
          min="1"
          step="1"
          required
          className="w-full rounded-2xl border border-slate/15 px-4 py-3 text-sm outline-none"
          placeholder="Cuota mensual"
        />
        <label className="flex items-start gap-3 rounded-2xl border border-slate/15 bg-sand/60 px-4 py-3">
          <input
            name="crear_pendiente_actual"
            type="checkbox"
            defaultChecked
            className="mt-1 h-4 w-4 rounded border-slate/30 accent-ink"
          />
          <span className="text-sm leading-6 text-ink">
            ¿Deseas dejarlo pendiente en el mes actual para que salga de una vez en los listados?
          </span>
        </label>
        <button
          type="submit"
          className="w-full rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white"
        >
          Guardar cliente
        </button>
      </form>
    </section>
  );
}
