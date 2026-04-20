import "server-only";

import type { AssignedUser, Cliente } from "@/lib/types";
import { requireProfile } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function getAdminUserManagementData(): Promise<{
  usuarios: AssignedUser[];
  serviceRoleConfigured: boolean;
}> {
  const admin = await requireProfile(["admin"]);
  const supabase = getSupabaseServerClient(admin.accessToken);

  if (!supabase) {
    return {
      usuarios: [],
      serviceRoleConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
    };
  }

  const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, email, nombre, rol, gestiona_clientes_propios")
      .order("nombre");

  return {
    usuarios: (profilesData ?? [])
      .filter((profile) => profile.rol === "collector")
      .map((profile) => ({
        ...profile,
        clientesAsignados: [],
        totalClientes: 0
      })),
    serviceRoleConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  };
}
