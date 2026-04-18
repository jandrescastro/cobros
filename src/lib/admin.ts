import "server-only";

import type { AssignedUser, Cliente } from "@/lib/types";
import { requireProfile } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function getAdminUserManagementData(): Promise<{
  clientes: Cliente[];
  usuarios: AssignedUser[];
  serviceRoleConfigured: boolean;
}> {
  const admin = await requireProfile(["admin"]);
  const supabase = getSupabaseServerClient(admin.accessToken);

  if (!supabase) {
    return {
      clientes: [],
      usuarios: [],
      serviceRoleConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
    };
  }

  const [{ data: clientesData }, { data: profilesData }, { data: accessData }] = await Promise.all([
    supabase
      .from("clientes")
      .select("id, nombre, telefono, direccion, cuota_mensual, activo")
      .order("nombre"),
    supabase
      .from("profiles")
      .select("id, email, nombre, rol")
      .order("nombre"),
    supabase
      .from("user_client_access")
      .select("user_id, cliente_id")
  ]);

  const assignmentMap = new Map<string, string[]>();

  for (const row of accessData ?? []) {
    const current = assignmentMap.get(row.user_id) ?? [];
    current.push(row.cliente_id);
    assignmentMap.set(row.user_id, current);
  }

  return {
    clientes: (clientesData ?? []).map((cliente) => ({
      ...cliente,
      cuota_mensual: Number(cliente.cuota_mensual)
    })),
    usuarios: (profilesData ?? [])
      .filter((profile) => profile.rol === "collector")
      .map((profile) => ({
        ...profile,
        clientesAsignados: assignmentMap.get(profile.id) ?? []
      })),
    serviceRoleConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  };
}
