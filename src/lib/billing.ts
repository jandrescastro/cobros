import { CURRENT_MONTH, CURRENT_YEAR, mockClientes, mockCobros } from "@/lib/mock-data";
import { getCurrentProfile } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Cliente, Cobro, MetricaMensual, PendienteAcumulado, ResumenDashboard } from "@/lib/types";

const COBRO_META_PREFIX = "__COBRO_META__";
const CLIENTE_META_PREFIX = "__CLIENTE_META__";

type DatabaseCliente = {
  id: string;
  nombre: string;
  cuota_mensual: number | string;
  direccion?: string | null;
  dia_cobro_sugerido: number | null;
  responsable_cobro: "JOSE" | "HECTOR" | null;
  activo: boolean;
};

type DatabaseCobro = {
  id: string;
  cliente_id: string;
  anio: number;
  mes: number;
  monto: number | string;
  monto_original?: number | string | null;
  monto_abonado?: number | string | null;
  estado: "pagado" | "pendiente" | "abono";
  fecha_pago: string | null;
  observacion: string | null;
};

type BillingSnapshot = {
  clientes: Cliente[];
  cobros: Cobro[];
};

type LegacyCobroMeta = {
  legacyStatus?: "pagado" | "pendiente" | "abono";
  montoOriginal?: number;
  montoAbonado?: number;
};

type LegacyClienteMeta = {
  dia_cobro_sugerido?: number;
  responsable_cobro?: "JOSE" | "HECTOR";
};

function sortClientesBySuggestedDay(clientes: Cliente[]) {
  return [...clientes].sort((a, b) => {
    const dayA = a.dia_cobro_sugerido ?? 99;
    const dayB = b.dia_cobro_sugerido ?? 99;

    if (dayA !== dayB) {
      return dayA - dayB;
    }

    return a.nombre.localeCompare(b.nombre, "es");
  });
}

function sortCobrosDelMesByPriority(
  items: Array<{
    cliente: Cliente;
    cobro: Cobro;
  }>
) {
  return [...items].sort((a, b) => {
    const aIsPaid = a.cobro.estado === "pagado";
    const bIsPaid = b.cobro.estado === "pagado";

    if (aIsPaid !== bIsPaid) {
      return aIsPaid ? 1 : -1;
    }

    const dayA = a.cliente.dia_cobro_sugerido ?? 99;
    const dayB = b.cliente.dia_cobro_sugerido ?? 99;

    if (dayA !== dayB) {
      return dayA - dayB;
    }

    return a.cliente.nombre.localeCompare(b.cliente.nombre, "es");
  });
}

function buildClienteFingerprint(cliente: Cliente) {
  return [
    cliente.nombre.trim().toLowerCase(),
    String(cliente.cuota_mensual),
    String(cliente.dia_cobro_sugerido ?? ""),
    String(cliente.responsable_cobro ?? "")
  ].join("|");
}

function dedupeSnapshot(snapshot: BillingSnapshot): BillingSnapshot {
  const canonicalByFingerprint = new Map<string, Cliente>();
  const clientIdRemap = new Map<string, string>();

  for (const cliente of snapshot.clientes) {
    const fingerprint = buildClienteFingerprint(cliente);
    const canonical = canonicalByFingerprint.get(fingerprint);

    if (!canonical) {
      canonicalByFingerprint.set(fingerprint, cliente);
      clientIdRemap.set(cliente.id, cliente.id);
      continue;
    }

    clientIdRemap.set(cliente.id, canonical.id);
  }

  const dedupedCobrosMap = new Map<string, Cobro>();

  for (const cobro of snapshot.cobros) {
    const canonicalClienteId = clientIdRemap.get(cobro.cliente_id) ?? cobro.cliente_id;
    const dedupedCobro: Cobro = {
      ...cobro,
      cliente_id: canonicalClienteId
    };
    const cobroKey = `${canonicalClienteId}|${cobro.anio}|${cobro.mes}`;
    const existing = dedupedCobrosMap.get(cobroKey);

    if (!existing) {
      dedupedCobrosMap.set(cobroKey, dedupedCobro);
      continue;
    }

    const shouldReplace = existing.estado !== "pagado" && dedupedCobro.estado === "pagado";

    if (shouldReplace) {
      dedupedCobrosMap.set(cobroKey, dedupedCobro);
    }
  }

  return {
    clientes: Array.from(canonicalByFingerprint.values()).sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
    cobros: Array.from(dedupedCobrosMap.values())
  };
}

function normalizeCliente(cliente: DatabaseCliente): Cliente {
  const legacyMeta = extractLegacyClienteMeta(cliente.direccion ?? null);

  return {
    ...cliente,
    cuota_mensual: Number(cliente.cuota_mensual),
    dia_cobro_sugerido: cliente.dia_cobro_sugerido ?? legacyMeta?.dia_cobro_sugerido ?? null,
    responsable_cobro: cliente.responsable_cobro ?? legacyMeta?.responsable_cobro ?? null,
    tiene_pagos_realizados: false
  };
}

function extractLegacyClienteMeta(direccion: string | null) {
  if (!direccion?.startsWith(CLIENTE_META_PREFIX)) {
    return null as LegacyClienteMeta | null;
  }

  try {
    return JSON.parse(direccion.slice(CLIENTE_META_PREFIX.length)) as LegacyClienteMeta;
  } catch {
    return null as LegacyClienteMeta | null;
  }
}

function extractLegacyCobroMeta(observacion: string | null) {
  if (!observacion?.startsWith(COBRO_META_PREFIX)) {
    return { meta: null as LegacyCobroMeta | null, message: observacion };
  }

  const rawWithoutPrefix = observacion.slice(COBRO_META_PREFIX.length);
  const firstBreak = rawWithoutPrefix.indexOf("\n");
  const rawMeta = firstBreak >= 0 ? rawWithoutPrefix.slice(0, firstBreak) : rawWithoutPrefix;
  const rawMessage = firstBreak >= 0 ? rawWithoutPrefix.slice(firstBreak + 1).trim() : "";

  try {
    return {
      meta: JSON.parse(rawMeta) as LegacyCobroMeta,
      message: rawMessage || null
    };
  } catch {
    return { meta: null as LegacyCobroMeta | null, message: observacion };
  }
}

function normalizeCobro(cobro: DatabaseCobro): Cobro {
  const { meta, message } = extractLegacyCobroMeta(cobro.observacion);
  const monto = Number(cobro.monto);
  const estado = meta?.legacyStatus === "abono" ? "abono" : cobro.estado;
  const montoOriginal =
    cobro.monto_original != null
      ? Number(cobro.monto_original)
      : typeof meta?.montoOriginal === "number"
        ? meta.montoOriginal
        : monto;
  const montoAbonado =
    cobro.monto_abonado != null
      ? Number(cobro.monto_abonado)
      : typeof meta?.montoAbonado === "number"
        ? meta.montoAbonado
        : estado === "pagado"
          ? montoOriginal
          : 0;

  return {
    ...cobro,
    estado,
    monto,
    monto_original: montoOriginal,
    monto_abonado: montoAbonado,
    observacion: message
  };
}

async function getDatabaseSnapshot(): Promise<BillingSnapshot | null> {
  const profile = await getCurrentProfile();

  if (!profile) {
    return null;
  }

  const supabase = getSupabaseServerClient(profile.accessToken);

  if (!supabase) {
    return null;
  }

  const clientesQuery = supabase
    .from("clientes")
    .select("id, nombre, cuota_mensual, direccion, dia_cobro_sugerido, responsable_cobro, activo")
    .order("nombre");

  let { data: clientesData, error: clientesError } = await clientesQuery;

  if (clientesError) {
    const fallback = await supabase.from("clientes").select("id, nombre, cuota_mensual, direccion, activo").order("nombre");

    clientesData = (fallback.data ?? []).map((cliente) => ({
      ...cliente,
      dia_cobro_sugerido: null,
      responsable_cobro: null
    }));
    clientesError = fallback.error;
  }

  if (clientesError) {
    return null;
  }

  const cobrosQuery = supabase
    .from("cobros")
    .select("id, cliente_id, anio, mes, monto, monto_original, monto_abonado, estado, fecha_pago, observacion")
    .order("anio", { ascending: false })
    .order("mes", { ascending: false });

  let { data: cobrosData, error: cobrosError } = await cobrosQuery;

  if (cobrosError) {
    const fallback = await supabase
      .from("cobros")
      .select("id, cliente_id, anio, mes, monto, estado, fecha_pago, observacion")
      .order("anio", { ascending: false })
      .order("mes", { ascending: false });

    cobrosData = (fallback.data ?? []).map((cobro) => ({
      ...cobro,
      monto_original: null,
      monto_abonado: null
    }));
    cobrosError = fallback.error;
  }

  if (cobrosError) {
    return null;
  }

  const snapshot = dedupeSnapshot({
    clientes: (clientesData ?? []).map(normalizeCliente),
    cobros: (cobrosData ?? []).map(normalizeCobro)
  });

  const clientesConPagos = new Set(
    snapshot.cobros.filter((cobro) => cobro.estado === "pagado").map((cobro) => cobro.cliente_id)
  );

  return {
    clientes: snapshot.clientes.map((cliente) => ({
      ...cliente,
      tiene_pagos_realizados: clientesConPagos.has(cliente.id)
    })),
    cobros: snapshot.cobros
  };
}

async function getBillingSnapshot(): Promise<BillingSnapshot> {
  const databaseSnapshot = await getDatabaseSnapshot();

  if (databaseSnapshot) {
    return databaseSnapshot;
  }

  return dedupeSnapshot({
    clientes: mockClientes,
    cobros: mockCobros
  });
}

function buildMonthlyCharge(cliente: Cliente, year: number, month: number): Cobro {
  return {
    id: `generated-${cliente.id}-${year}-${month}`,
    cliente_id: cliente.id,
    anio: year,
    mes: month,
    monto: cliente.cuota_mensual,
    monto_original: cliente.cuota_mensual,
    monto_abonado: 0,
    estado: "pendiente",
    fecha_pago: null,
    observacion: "Cobro generado automaticamente para cliente activo"
  };
}

export async function getClientes() {
  const { clientes } = await getBillingSnapshot();
  return sortClientesBySuggestedDay(clientes);
}

export async function getCobrosByCliente(clienteId: string) {
  const { cobros } = await getBillingSnapshot();

  return cobros.filter((cobro) => cobro.cliente_id === clienteId).sort((a, b) => b.anio - a.anio || b.mes - a.mes);
}

export async function getClienteById(clienteId: string) {
  const clientes = await getClientes();
  return clientes.find((cliente) => cliente.id === clienteId) ?? null;
}

export async function getCobroDelMes(clienteId: string, year = CURRENT_YEAR, month = CURRENT_MONTH) {
  const { cobros } = await getBillingSnapshot();

  return cobros.find((cobro) => cobro.cliente_id === clienteId && cobro.anio === year && cobro.mes === month);
}

export async function buildCobrosDelMes(year = CURRENT_YEAR, month = CURRENT_MONTH) {
  const { clientes, cobros } = await getBillingSnapshot();

  return sortCobrosDelMesByPriority(
    sortClientesBySuggestedDay(clientes)
    .filter((cliente) => cliente.activo)
    .map((cliente) => ({
      cliente,
      cobro:
        cobros.find((item) => item.cliente_id === cliente.id && item.anio === year && item.mes === month) ??
        buildMonthlyCharge(cliente, year, month)
    }))
  );
}

export async function getResumenDashboard(year = CURRENT_YEAR, month = CURRENT_MONTH): Promise<ResumenDashboard> {
  const cobrosDelMes = (await buildCobrosDelMes(year, month)).map((item) => item.cobro);
  const clientes = await getClientes();
  const pendientes = cobrosDelMes.filter((cobro) => cobro.estado !== "pagado");

  return {
    totalClientesActivos: clientes.filter((cliente) => cliente.activo).length,
    clientesPendientes: pendientes.length,
    montoCobrado: cobrosDelMes
      .filter((cobro) => cobro.estado === "pagado")
      .reduce((total, cobro) => total + cobro.monto, 0),
    montoPendiente: pendientes.reduce((total, cobro) => total + cobro.monto, 0)
  };
}

export async function getPendientesAcumulados(): Promise<PendienteAcumulado[]> {
  const { clientes, cobros } = await getBillingSnapshot();

  return clientes
    .map((cliente) => {
      const mesesPendientes = cobros
        .filter((cobro) => cobro.cliente_id === cliente.id && cobro.estado !== "pagado")
        .sort((a, b) => b.anio - a.anio || b.mes - a.mes);

      return {
        cliente,
        cantidadPendientes: mesesPendientes.length,
        totalPendiente: mesesPendientes.reduce((total, cobro) => total + cobro.monto, 0),
        mesesPendientes
      };
    })
    .filter((item) => item.cantidadPendientes > 0)
    .sort((a, b) => {
      const dayA = a.cliente.dia_cobro_sugerido ?? 99;
      const dayB = b.cliente.dia_cobro_sugerido ?? 99;

      if (dayA !== dayB) {
        return dayA - dayB;
      }

      return a.cliente.nombre.localeCompare(b.cliente.nombre, "es");
    });
}

export async function getHistoricoCliente(clienteId: string) {
  const cobros = await getCobrosByCliente(clienteId);

  return cobros.map((cobro) => ({
    cobro,
    esArrastre: cobro.estado !== "pagado" && (cobro.anio < CURRENT_YEAR || cobro.mes < CURRENT_MONTH)
  }));
}

export async function getMetricasMensuales(anio = CURRENT_YEAR): Promise<MetricaMensual[]> {
  const metricas = await Promise.all(
    Array.from({ length: 12 }, async (_, index) => {
      const mes = index + 1;
      const resumen = await getResumenDashboard(anio, mes);
      const cobros = await buildCobrosDelMes(anio, mes);

      return {
        anio,
        mes,
        montoCobrado: resumen.montoCobrado,
        montoPendiente: resumen.montoPendiente,
        clientesPendientes: resumen.clientesPendientes,
        totalCobros: cobros.length
      };
    })
  );

  return metricas;
}
