export type CobroEstado = "pagado" | "pendiente" | "abono";
export type AppRole = "admin" | "collector";

export type Cliente = {
  id: string;
  nombre: string;
  cuota_mensual: number;
  dia_cobro_sugerido: number | null;
  responsable_cobro: "JOSE" | "HECTOR" | null;
  activo: boolean;
  tiene_pagos_realizados: boolean;
};

export type Cobro = {
  id: string;
  cliente_id: string;
  anio: number;
  mes: number;
  monto: number;
  monto_original: number;
  monto_abonado: number;
  estado: CobroEstado;
  fecha_pago: string | null;
  observacion: string | null;
};

export type AppProfile = {
  id: string;
  email: string;
  nombre: string;
  rol: AppRole;
  gestiona_clientes_propios: boolean;
};

export type AssignedUser = AppProfile & {
  clientesAsignados: string[];
  totalClientes: number;
};

export type ResumenDashboard = {
  totalClientesActivos: number;
  clientesPendientes: number;
  montoCobrado: number;
  montoPendiente: number;
};

export type PendienteAcumulado = {
  cliente: Cliente;
  cantidadPendientes: number;
  totalPendiente: number;
  mesesPendientes: Cobro[];
};

export type MetricaMensual = {
  anio: number;
  mes: number;
  montoCobrado: number;
  montoPendiente: number;
  clientesPendientes: number;
  totalCobros: number;
};
