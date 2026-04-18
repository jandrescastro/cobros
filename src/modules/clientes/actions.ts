"use server";

import { revalidatePath } from "next/cache";
import { CURRENT_MONTH, CURRENT_YEAR } from "@/lib/mock-data";
import { requireProfile } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function cleanText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export async function createCliente(formData: FormData) {
  const profile = await requireProfile(["admin"]);
  const supabase = getSupabaseServerClient(profile.accessToken);

  if (!supabase) {
    return;
  }

  const nombre = cleanText(formData.get("nombre"));
  const telefono = cleanText(formData.get("telefono"));
  const direccion = cleanText(formData.get("direccion"));
  const cuotaMensual = Number(cleanText(formData.get("cuota_mensual")));
  const crearPendienteActual = formData.get("crear_pendiente_actual") === "on";

  if (!nombre || !telefono || !direccion || !Number.isFinite(cuotaMensual) || cuotaMensual <= 0) {
    return;
  }

  const { data: clienteCreado, error } = await supabase
    .from("clientes")
    .insert({
      nombre,
      telefono,
      direccion,
      cuota_mensual: cuotaMensual,
      activo: true
    })
    .select("id")
    .single();

  if (error || !clienteCreado) {
    return;
  }

  if (crearPendienteActual) {
    await supabase.from("cobros").upsert(
      {
        cliente_id: clienteCreado.id,
        anio: CURRENT_YEAR,
        mes: CURRENT_MONTH,
        monto: cuotaMensual,
        estado: "pendiente",
        fecha_pago: null,
        observacion: "Cobro inicial generado al crear el cliente"
      },
      {
        onConflict: "cliente_id,anio,mes"
      }
    );
  }

  revalidatePath("/clientes");
  revalidatePath("/");
  revalidatePath("/mes");
  revalidatePath("/pendientes");
  revalidatePath("/admin/usuarios");
}

export async function toggleClienteActivo(formData: FormData) {
  const profile = await requireProfile(["admin"]);
  const supabase = getSupabaseServerClient(profile.accessToken);

  if (!supabase) {
    return;
  }

  const clienteId = cleanText(formData.get("cliente_id"));
  const activoActual = formData.get("activo_actual") === "true";

  if (!clienteId) {
    return;
  }

  await supabase.from("clientes").update({ activo: !activoActual }).eq("id", clienteId);

  revalidatePath("/clientes");
  revalidatePath("/");
  revalidatePath("/mes");
  revalidatePath("/pendientes");
  revalidatePath(`/clientes/${clienteId}`);
}
