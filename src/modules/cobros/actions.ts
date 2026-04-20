"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { parseCurrencyInput } from "@/lib/utils";

const COBRO_META_PREFIX = "__COBRO_META__";

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(value);
}

function getCobroBase(formData: FormData) {
  const clienteId = String(formData.get("clienteId"));
  const anio = Number(formData.get("anio"));
  const mes = Number(formData.get("mes"));
  const currentStatus = String(formData.get("currentStatus")) as "pagado" | "pendiente" | "abono";
  const currentMonto = parseCurrencyInput(String(formData.get("monto")));
  const currentOriginalRaw = parseCurrencyInput(String(formData.get("montoOriginal")));
  const currentAbonadoRaw = parseCurrencyInput(String(formData.get("montoAbonado")));
  const currentOriginal = Number.isFinite(currentOriginalRaw) && currentOriginalRaw > 0 ? currentOriginalRaw : currentMonto;
  const currentAbonado =
    Number.isFinite(currentAbonadoRaw) && currentAbonadoRaw >= 0
      ? currentAbonadoRaw
      : currentStatus === "pagado"
        ? currentOriginal
        : 0;

  return {
    clienteId,
    anio,
    mes,
    currentStatus,
    currentMonto,
    currentOriginal,
    currentAbonado
  };
}

function revalidateCobroPaths(clienteId: string) {
  revalidatePath("/");
  revalidatePath("/mes");
  revalidatePath("/pendientes");
  revalidatePath("/clientes");
  revalidatePath(`/clientes/${clienteId}`);
}

type CobroWritePayload = {
  cliente_id: string;
  anio: number;
  mes: number;
  monto: number;
  monto_original: number;
  monto_abonado: number;
  estado: "pagado" | "pendiente" | "abono";
  fecha_pago: string | null;
  observacion: string | null;
};

function buildLegacyObservation(
  legacyStatus: "pagado" | "pendiente" | "abono",
  montoOriginal: number,
  montoAbonado: number,
  message: string | null
) {
  if (legacyStatus === "pagado" || (legacyStatus === "pendiente" && montoAbonado <= 0)) {
    return message;
  }

  return `${COBRO_META_PREFIX}${JSON.stringify({
    legacyStatus,
    montoOriginal,
    montoAbonado
  })}\n${message ?? ""}`.trim();
}

async function upsertCobroCompatible(
  supabase: NonNullable<ReturnType<typeof getSupabaseServerClient>>,
  payload: CobroWritePayload
) {
  const modernAttempt = await supabase.from("cobros").upsert(payload, {
    onConflict: "cliente_id,anio,mes"
  });

  if (!modernAttempt.error) {
    return modernAttempt;
  }

  return supabase.from("cobros").upsert(
    {
      cliente_id: payload.cliente_id,
      anio: payload.anio,
      mes: payload.mes,
      monto: payload.estado === "pagado" ? payload.monto_original : payload.monto,
      estado: payload.estado === "abono" ? "pendiente" : payload.estado,
      fecha_pago: payload.fecha_pago,
      observacion: buildLegacyObservation(
        payload.estado,
        payload.monto_original,
        payload.monto_abonado,
        payload.observacion
      )
    },
    {
      onConflict: "cliente_id,anio,mes"
    }
  );
}

export async function updateCobroStatus(formData: FormData) {
  const profile = await requireProfile(["collector", "admin"]);
  const supabase = getSupabaseServiceClient() ?? getSupabaseServerClient(profile.accessToken);

  if (!supabase) {
    return;
  }

  const { clienteId, anio, mes, currentStatus, currentMonto, currentOriginal, currentAbonado } = getCobroBase(formData);
  const paymentType = String(formData.get("paymentType") ?? "total");
  const paymentAmount = parseCurrencyInput(String(formData.get("paymentAmount")));

  if (!clienteId || !Number.isFinite(anio) || !Number.isFinite(mes) || !Number.isFinite(currentMonto) || currentMonto < 0) {
    return;
  }

  if (currentStatus === "pagado") {
    await upsertCobroCompatible(supabase, {
      cliente_id: clienteId,
      anio,
      mes,
      monto: currentOriginal,
      monto_original: currentOriginal,
      monto_abonado: 0,
      estado: "pendiente",
      fecha_pago: null,
      observacion: "Pago revertido desde la lista mensual"
    });

    revalidateCobroPaths(clienteId);
    return;
  }

  if (paymentType === "abono") {
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      return;
    }

    const nextAbonado = currentAbonado + paymentAmount;
    const saldoRestante = Math.max(currentOriginal - nextAbonado, 0);
    const isFullPayment = saldoRestante <= 0;

    await upsertCobroCompatible(supabase, {
      cliente_id: clienteId,
      anio,
      mes,
      monto: isFullPayment ? currentOriginal : saldoRestante,
      monto_original: currentOriginal,
      monto_abonado: isFullPayment ? currentOriginal : nextAbonado,
      estado: isFullPayment ? "pagado" : "abono",
      fecha_pago: new Date().toISOString().slice(0, 10),
      observacion: isFullPayment
        ? `Abono final registrado. Total pagado ${formatMoney(currentOriginal)}.`
        : `Abono registrado por ${formatMoney(paymentAmount)}. Saldo pendiente ${formatMoney(saldoRestante)}.`
    });

    revalidateCobroPaths(clienteId);
    return;
  }

  await upsertCobroCompatible(supabase, {
    cliente_id: clienteId,
    anio,
    mes,
    monto: currentOriginal,
    monto_original: currentOriginal,
    monto_abonado: currentOriginal,
    estado: "pagado",
    fecha_pago: new Date().toISOString().slice(0, 10),
    observacion: "Pago total registrado desde la lista mensual"
  });

  revalidateCobroPaths(clienteId);
}

export async function updateCobroMonto(formData: FormData) {
  const profile = await requireProfile(["collector", "admin"]);
  const supabase = getSupabaseServiceClient() ?? getSupabaseServerClient(profile.accessToken);

  if (!supabase) {
    return;
  }

  const { clienteId, anio, mes, currentStatus, currentOriginal, currentAbonado } = getCobroBase(formData);
  const monto = parseCurrencyInput(String(formData.get("monto")));

  if (!clienteId || !Number.isFinite(anio) || !Number.isFinite(mes) || !Number.isFinite(monto) || monto <= 0) {
    return;
  }

  if (currentStatus === "pagado") {
    await upsertCobroCompatible(supabase, {
      cliente_id: clienteId,
      anio,
      mes,
      monto,
      monto_original: monto,
      monto_abonado: monto,
      estado: "pagado",
      fecha_pago: new Date().toISOString().slice(0, 10),
      observacion: "Monto total ajustado despues de registrar el pago"
    });

    revalidateCobroPaths(clienteId);
    return;
  }

  const nextOriginal = currentAbonado + monto;
  const nextStatus = currentAbonado > 0 ? "abono" : "pendiente";

  await upsertCobroCompatible(supabase, {
    cliente_id: clienteId,
    anio,
    mes,
    monto,
    monto_original: nextOriginal,
    monto_abonado: currentAbonado,
    estado: nextStatus,
    fecha_pago: currentStatus === "abono" ? new Date().toISOString().slice(0, 10) : null,
    observacion:
      nextStatus === "abono"
        ? `Saldo pendiente actualizado manualmente. Quedan ${formatMoney(monto)} por cobrar.`
        : "Monto pendiente actualizado manualmente"
  });

  revalidateCobroPaths(clienteId);
}
