import { Plus } from "lucide-react";
import { createCliente } from "@/modules/clientes/actions";
import { DayCardPicker } from "@/modules/clientes/components/day-card-picker";

export function ClientFormCard() {
  return (
    <section className="rounded-card border border-dashed border-ink/20 bg-white/80 p-4 shadow-soft">
      <div className="mb-4 flex items-center gap-2">
        <span className="rounded-full bg-ink p-2 text-white">
          <Plus className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">Agregar cliente</h2>
          <p className="text-sm text-slate">Crea un cliente nuevo y activalo para el cobro mensual.</p>
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
          name="cuota_mensual"
          type="text"
          inputMode="numeric"
          required
          className="w-full rounded-2xl border border-slate/15 px-4 py-3 text-sm outline-none"
          placeholder="Cuota mensual"
        />
        <div className="rounded-2xl border border-slate/15 bg-sand/50 p-3">
          <p className="mb-3 text-sm font-semibold text-ink">Dia sugerido de cobro</p>
          <DayCardPicker name="dia_cobro_sugerido" selectedDay={1} required />
        </div>
        <select
          name="responsable_cobro"
          required
          defaultValue="JOSE"
          className="w-full rounded-2xl border border-slate/15 px-4 py-3 text-sm outline-none"
        >
          <option value="JOSE">JOSE</option>
          <option value="HECTOR">HECTOR</option>
        </select>
        <label className="flex items-start gap-3 rounded-2xl border border-slate/15 bg-sand/60 px-4 py-3">
          <input
            name="crear_pendiente_actual"
            type="checkbox"
            defaultChecked
            className="mt-1 h-4 w-4 rounded border-slate/30 accent-ink"
          />
          <span className="text-sm leading-6 text-ink">
            Deseas dejarlo pendiente en el mes actual para que salga de una vez en los listados?
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
