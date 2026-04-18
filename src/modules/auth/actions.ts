"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearSessionCookies, requireProfile, setSessionCookies } from "@/lib/auth";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";

function cleanText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export async function loginWithPassword(formData: FormData) {
  const email = cleanText(formData.get("email")).toLowerCase();
  const password = cleanText(formData.get("password"));
  const supabase = getSupabaseServerClient();

  if (!supabase || !email || !password) {
    redirect("/login?error=credenciales");
  }

  const {
    data: { session },
    error
  } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error || !session) {
    redirect("/login?error=credenciales");
  }

  await setSessionCookies(session.access_token, session.refresh_token);

  const roleClient = getSupabaseServerClient(session.access_token);
  const { data: profile } = await roleClient!
    .from("profiles")
    .select("rol")
    .eq("id", session.user.id)
    .single();

  redirect(profile?.rol === "admin" ? "/admin/usuarios" : "/");
}

export async function logout() {
  await clearSessionCookies();
  redirect("/login");
}

export async function createManagedUser(formData: FormData) {
  const admin = await requireProfile(["admin"]);
  const service = getSupabaseServiceClient();

  if (!service) {
    redirect("/admin/usuarios?error=service-role");
  }

  const nombre = cleanText(formData.get("nombre"));
  const email = cleanText(formData.get("email")).toLowerCase();
  const password = cleanText(formData.get("password"));
  const selectedClients = formData
    .getAll("cliente_ids")
    .map((value) => String(value))
    .filter(Boolean);

  if (!nombre || !email || password.length < 8) {
    redirect("/admin/usuarios?error=datos");
  }

  const { data: authUser, error: authError } = await service!.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      nombre,
      created_by: admin.id
    }
  });

  if (authError || !authUser.user) {
    redirect("/admin/usuarios?error=crear-usuario");
  }

  const userId = authUser.user.id;

  const { error: profileError } = await service!
    .from("profiles")
    .insert({
      id: userId,
      email,
      nombre,
      rol: "collector"
    });

  if (profileError) {
    await service!.auth.admin.deleteUser(userId);
    redirect("/admin/usuarios?error=perfil");
  }

  if (selectedClients.length > 0) {
    const { error: accessError } = await service!
      .from("user_client_access")
      .insert(selectedClients.map((clienteId) => ({ user_id: userId, cliente_id: clienteId })));

    if (accessError) {
      await service!.from("profiles").delete().eq("id", userId);
      await service!.auth.admin.deleteUser(userId);
      redirect("/admin/usuarios?error=asignaciones");
    }
  }

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios?created=1");
}
