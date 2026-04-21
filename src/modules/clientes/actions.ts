"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CURRENT_MONTH, CURRENT_YEAR } from "@/lib/mock-data";
import { requireProfile } from "@/lib/auth";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { parseCurrencyInput } from "@/lib/utils";

const CLIENTE_META_PREFIX = "__CLIENTE_META__";
const COBRO_META_PREFIX = "__COBRO_META__";

function cleanText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function parseSuggestedDay(value: FormDataEntryValue | null) {
  const raw = cleanText(value);

  if (!raw) {
    return null;
  }

  const day = Number(raw);
  return Number.isInteger(day) && day >= 1 && day <= 31 ? day : null;
}

function parseResponsible(value: FormDataEntryValue | null) {
  const responsible = cleanText(value).toUpperCase();
  return responsible === "JOSE" || responsible === "HECTOR" ? responsible : null;
}

function buildLegacyClientMeta(diaCobroSugerido: number, responsableCobro: "JOSE" | "HECTOR") {
  return `${CLIENTE_META_PREFIX}${JSON.stringify({
    dia_cobro_sugerido: diaCobroSugerido,
    responsable_cobro: responsableCobro
  })}`;
}

function hasProtectedPaymentHistory(observacion: string | null, estado: string) {
  if (estado === "pagado" || estado === "abono") {
    return true;
  }

  if (!observacion?.startsWith(COBRO_META_PREFIX)) {
    return false;
  }

  return observacion.includes('"legacyStatus":"pagado"') || observacion.includes('"legacyStatus":"abono"');
}

export async function createCliente(formData: FormData) {
  const profile = await requireProfile(["admin", "collector"]);
  const supabase = getSupabaseServiceClient() ?? getSupabaseServerClient(profile.accessToken);

  if (!supabase) {
    return;
  }

  const nombre = cleanText(formData.get("nombre"));
  const cuotaMensual = parseCurrencyInput(cleanText(formData.get("cuota_mensual")));
  const diaCobroSugerido = parseSuggestedDay(formData.get("dia_cobro_sugerido"));
  const responsableCobro = parseResponsible(formData.get("responsable_cobro"));
  const crearPendienteActual = formData.get("crear_pendiente_actual") === "on";

  if (!nombre || !Number.isFinite(cuotaMensual) || cuotaMensual <= 0 || !diaCobroSugerido || !responsableCobro) {
    return;
  }

  const clientePayload = {
    nombre,
    telefono: "",
    direccion: buildLegacyClientMeta(diaCobroSugerido, responsableCobro),
    cuota_mensual: cuotaMensual,
    dia_cobro_sugerido: diaCobroSugerido,
    responsable_cobro: responsableCobro,
    activo: true,
    owner_user_id: profile.rol === "collector" ? profile.id : null
  };

  let { data: clienteCreado, error } = await supabase
    .from("clientes")
    .insert(clientePayload)
    .select("id")
    .single();

  if (error) {
    const fallback = await supabase
      .from("clientes")
      .insert({
        nombre,
        telefono: "",
        direccion: buildLegacyClientMeta(diaCobroSugerido, responsableCobro),
        cuota_mensual: cuotaMensual,
        activo: true,
        owner_user_id: profile.rol === "collector" ? profile.id : null
      })
      .select("id")
      .single();

    clienteCreado = fallback.data;
    error = fallback.error;
  }

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

export async function updateCliente(formData: FormData) {
  const profile = await requireProfile(["admin", "collector"]);
  const supabase = getSupabaseServiceClient() ?? getSupabaseServerClient(profile.accessToken);

  if (!supabase) {
    return;
  }

  const clienteId = cleanText(formData.get("cliente_id"));
  const nombre = cleanText(formData.get("nombre"));
  const cuotaMensual = parseCurrencyInput(cleanText(formData.get("cuota_mensual")));
  const diaCobroSugerido = parseSuggestedDay(formData.get("dia_cobro_sugerido"));
  const responsableCobro = parseResponsible(formData.get("responsable_cobro"));

  if (!clienteId || !nombre || !Number.isFinite(cuotaMensual) || cuotaMensual <= 0 || !diaCobroSugerido || !responsableCobro) {
    return;
  }

  let { error } = await supabase
    .from("clientes")
    .update({
      nombre,
      cuota_mensual: cuotaMensual,
      direccion: buildLegacyClientMeta(diaCobroSugerido, responsableCobro),
      dia_cobro_sugerido: diaCobroSugerido,
      responsable_cobro: responsableCobro
    })
    .eq("id", clienteId);

  if (error) {
    const fallback = await supabase
      .from("clientes")
      .update({
        nombre,
        cuota_mensual: cuotaMensual,
        direccion: buildLegacyClientMeta(diaCobroSugerido, responsableCobro)
      })
      .eq("id", clienteId);

    error = fallback.error;
  }

  if (error) {
    return;
  }

  revalidatePath("/clientes");
  revalidatePath("/");
  revalidatePath("/mes");
  revalidatePath("/pendientes");
  revalidatePath(`/clientes/${clienteId}`);
}

export async function toggleClienteActivo(formData: FormData) {
  const profile = await requireProfile(["admin", "collector"]);
  const supabase = getSupabaseServiceClient() ?? getSupabaseServerClient(profile.accessToken);

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

export async function deleteCliente(formData: FormData) {
  const profile = await requireProfile(["admin", "collector"]);
  const supabase = getSupabaseServiceClient() ?? getSupabaseServerClient(profile.accessToken);

  if (!supabase) {
    redirect("/clientes?error=servidor");
  }

  const clienteId = cleanText(formData.get("cliente_id"));

  if (!clienteId) {
    redirect("/clientes?error=cliente");
  }

  const { data: cobrosRelacionados, error: pagosError } = await supabase
    .from("cobros")
    .select("estado, observacion")
    .eq("cliente_id", clienteId);

  if (pagosError) {
    redirect("/clientes?error=pagos");
  }

  if ((cobrosRelacionados ?? []).some((cobro) => hasProtectedPaymentHistory(cobro.observacion, cobro.estado))) {
    redirect("/clientes?error=pagos-realizados");
  }

  const { error } = await supabase
    .from("clientes")
    .delete()
    .eq("id", clienteId);

  if (error) {
    redirect("/clientes?error=eliminar");
  }

  revalidatePath("/clientes");
  revalidatePath("/");
  revalidatePath("/mes");
  revalidatePath("/pendientes");
  redirect("/clientes?deleted=1");
}
