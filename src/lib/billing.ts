import { CURRENT_MONTH, CURRENT_YEAR, mockClientes, mockCobros } from "@/lib/mock-data";
import { getCurrentProfile } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Cliente, Cobro, MetricaMensual, PendienteAcumulado, ResumenDashboard } from "@/lib/types";

type DatabaseCliente = {
  id: string;
  nombre: string;
  telefono: string;
  direccion: string;
  cuota_mensual: number | string;
  activo: boolean;
};

type DatabaseCobro = {
  id: string;
  cliente_id: string;
  anio: number;
  mes: number;
  monto: number | string;
  estado: "pagado" | "pendiente";
  fecha_pago: string | null;
  observacion: string | null;
};

type BillingSnapshot = {
  clientes: Cliente[];
  cobros: Cobro[];
};

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function buildClienteFingerprint(cliente: Cliente) {
  return [
    cliente.nombre.trim().toLowerCase(),
    normalizePhone(cliente.telefono),
    cliente.direccion.trim().toLowerCase(),
    String(cliente.cuota_mensual)
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
  return {
    ...cliente,
    cuota_mensual: Number(cliente.cuota_mensual)
  };
}

function normalizeCobro(cobro: DatabaseCobro): Cobro {
  return {
    ...cobro,
    monto: Number(cobro.monto)
  };
}

async function getAccessibleClientIds(accessToken: string, userId: string) {
  const supabase = getSupabaseServerClient(accessToken);

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("user_client_access")
    .select("cliente_id")
    .eq("user_id", userId);

  if (error || !data) {
    return [];
  }

  return data.map((row) => row.cliente_id);
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

  let allowedClientIds: string[] | null = null;

  if (profile.rol === "collector") {
    allowedClientIds = await getAccessibleClientIds(profile.accessToken, profile.id);

    if (allowedClientIds.length === 0) {
      return {
        clientes: [],
        cobros: []
      };
    }
  }

  let clientesQuery = supabase
    .from("clientes")
    .select("id, nombre, telefono, direccion, cuota_mensual, activo")
    .order("nombre");

  if (allowedClientIds) {
    clientesQuery = clientesQuery.in("id", allowedClientIds);
  }

  const { data: clientesData, error: clientesError } = await clientesQuery;

  if (clientesError) {
    return null;
  }

  let cobrosQuery = supabase
    .from("cobros")
    .select("id, cliente_id, anio, mes, monto, estado, fecha_pago, observacion")
    .order("anio", { ascending: false })
    .order("mes", { ascending: false });

  if (allowedClientIds) {
    cobrosQuery = cobrosQuery.in("cliente_id", allowedClientIds);
  }

  const { data: cobrosData, error: cobrosError } = await cobrosQuery;

  if (cobrosError) {
    return null;
  }

  return dedupeSnapshot({
    clientes: (clientesData ?? []).map(normalizeCliente),
    cobros: (cobrosData ?? []).map(normalizeCobro)
  });
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
    estado: "pendiente",
    fecha_pago: null,
    observacion: "Cobro generado automaticamente para cliente activo"
  };
}

export async function getClientes() {
  const { clientes } = await getBillingSnapshot();
  return clientes;
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

  return clientes
    .filter((cliente) => cliente.activo)
    .map((cliente) => ({
      cliente,
      cobro:
        cobros.find((item) => item.cliente_id === cliente.id && item.anio === year && item.mes === month) ??
        buildMonthlyCharge(cliente, year, month)
    }));
}

export async function getResumenDashboard(year = CURRENT_YEAR, month = CURRENT_MONTH): Promise<ResumenDashboard> {
  const cobrosDelMes = (await buildCobrosDelMes(year, month)).map((item) => item.cobro);
  const clientes = await getClientes();
  const pendientes = cobrosDelMes.filter((cobro) => cobro.estado === "pendiente");

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
        .filter((cobro) => cobro.cliente_id === cliente.id && cobro.estado === "pendiente")
        .sort((a, b) => b.anio - a.anio || b.mes - a.mes);

      return {
        cliente,
        cantidadPendientes: mesesPendientes.length,
        totalPendiente: mesesPendientes.reduce((total, cobro) => total + cobro.monto, 0),
        mesesPendientes
      };
    })
    .filter((item) => item.cantidadPendientes > 0)
    .sort((a, b) => b.totalPendiente - a.totalPendiente);
}

export async function getHistoricoCliente(clienteId: string) {
  const cobros = await getCobrosByCliente(clienteId);

  return cobros.map((cobro) => ({
    cobro,
    esArrastre: cobro.estado === "pendiente" && (cobro.anio < CURRENT_YEAR || cobro.mes < CURRENT_MONTH)
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
