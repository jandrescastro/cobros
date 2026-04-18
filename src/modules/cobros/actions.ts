"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function updateCobroStatus(formData: FormData) {
  const profile = await requireProfile(["collector", "admin"]);
  const supabase = getSupabaseServerClient(profile.accessToken);

  if (!supabase) {
    return;
  }

  const clienteId = String(formData.get("clienteId"));
  const anio = Number(formData.get("anio"));
  const mes = Number(formData.get("mes"));
  const monto = Number(formData.get("monto"));
  const currentStatus = String(formData.get("currentStatus"));
  const nextStatus = currentStatus === "pagado" ? "pendiente" : "pagado";

  await supabase.from("cobros").upsert(
    {
      cliente_id: clienteId,
      anio,
      mes,
      monto,
      estado: nextStatus,
      fecha_pago: nextStatus === "pagado" ? new Date().toISOString().slice(0, 10) : null,
      observacion:
        nextStatus === "pagado"
          ? "Pago marcado desde la lista mensual"
          : "Pago revertido desde la lista mensual"
    },
    {
      onConflict: "cliente_id,anio,mes"
    }
  );

  revalidatePath("/");
  revalidatePath("/mes");
  revalidatePath("/pendientes");
  revalidatePath("/clientes");
  revalidatePath(`/clientes/${clienteId}`);
}
