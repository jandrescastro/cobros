export type CobroEstado = "pagado" | "pendiente";
export type AppRole = "admin" | "collector";

export type Cliente = {
  id: string;
  nombre: string;
  telefono: string;
  direccion: string;
  cuota_mensual: number;
  activo: boolean;
};

export type Cobro = {
  id: string;
  cliente_id: string;
  anio: number;
  mes: number;
  monto: number;
  estado: CobroEstado;
  fecha_pago: string | null;
  observacion: string | null;
};

export type AppProfile = {
  id: string;
  email: string;
  nombre: string;
  rol: AppRole;
};

export type AssignedUser = AppProfile & {
  clientesAsignados: string[];
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
