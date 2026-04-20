"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearSessionCookies, getCurrentProfile, getCurrentSession, requireProfile, setSessionCookies } from "@/lib/auth";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";

const USERNAME_PATTERN = /^[A-Za-z0-9._ -]{3,30}$/;

function cleanText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function normalizeUsername(value: FormDataEntryValue | null) {
  const username = cleanText(value).replace(/\s+/g, " ");
  return USERNAME_PATTERN.test(username) ? username : null;
}

function canonicalUsername(username: string) {
  return username.trim().replace(/\s+/g, " ").toLowerCase();
}

function buildManagedUserEmail(username: string) {
  const localPart = canonicalUsername(username)
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9._-]/g, "");

  return `${localPart}@usuarios.local`;
}

export async function loginWithPassword(formData: FormData) {
  const username = normalizeUsername(formData.get("username"));
  const password = cleanText(formData.get("password"));
  const supabase = getSupabaseServerClient();
  const service = getSupabaseServiceClient();

  if (!supabase || !service || !username || !password) {
    redirect("/login?error=credenciales");
  }

  const { data: loginProfile } = await service
    .from("profiles")
    .select("email,nombre");

  const matchedProfile = loginProfile?.find((profile) => canonicalUsername(profile.nombre) === canonicalUsername(username));
  const email = matchedProfile?.email ?? buildManagedUserEmail(username);

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
  const { data: roleProfile } = await roleClient!
    .from("profiles")
    .select("rol")
    .eq("id", session.user.id)
    .single();

  redirect(roleProfile?.rol === "admin" ? "/admin/usuarios" : "/");
}

export async function logout() {
  await clearSessionCookies();
  redirect("/login");
}

export async function completeInvitedUserPassword(formData: FormData) {
  const password = cleanText(formData.get("password"));
  const confirmPassword = cleanText(formData.get("confirmPassword"));
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login?error=credenciales");
  }

  if (password.length < 4 || password !== confirmPassword) {
    redirect("/crear-contrasena?error=password");
  }

  const supabase = getSupabaseServerClient(session.accessToken);

  if (!supabase) {
    redirect("/crear-contrasena?error=servidor");
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect("/crear-contrasena?error=password");
  }

  const profile = await getCurrentProfile();

  redirect(profile?.rol === "admin" ? "/admin/usuarios" : "/");
}

export async function createManagedUser(formData: FormData) {
  const admin = await requireProfile(["admin"]);
  const service = getSupabaseServiceClient();

  if (!service) {
    redirect("/admin/usuarios?error=service-role");
  }

  const username = normalizeUsername(formData.get("username"));
  const password = cleanText(formData.get("password"));

  if (!username || password.length < 4) {
    redirect("/admin/usuarios?error=datos");
  }

  const email = buildManagedUserEmail(username);

  const { count: existingUsers } = await service!
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .ilike("nombre", canonicalUsername(username));

  if ((existingUsers ?? 0) > 0) {
    redirect("/admin/usuarios?error=usuario-existe");
  }

  const { data: authUser, error: authError } = await service!.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      nombre: username,
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
      nombre: username,
      rol: "collector",
      gestiona_clientes_propios: false
    });

  if (profileError) {
    await service!.auth.admin.deleteUser(userId);
    redirect("/admin/usuarios?error=perfil");
  }

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios?created=1");
}

export async function updateManagedUser(formData: FormData) {
  const admin = await requireProfile(["admin"]);
  const service = getSupabaseServiceClient();

  if (!service) {
    redirect("/admin/usuarios?error=service-role");
  }

  const userId = cleanText(formData.get("userId"));
  const username = normalizeUsername(formData.get("username"));
  const password = cleanText(formData.get("password"));

  if (!userId || !username) {
    redirect("/admin/usuarios?error=editar-usuario");
  }

  if (password && password.length < 4) {
    redirect("/admin/usuarios?error=password");
  }

  const { count: existingUsers } = await service!
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .ilike("nombre", canonicalUsername(username))
    .neq("id", userId);

  if ((existingUsers ?? 0) > 0) {
    redirect("/admin/usuarios?error=usuario-existe");
  }

  const email = buildManagedUserEmail(username);
  const { error: authUpdateError } = await service!.auth.admin.updateUserById(userId, {
    email,
    ...(password ? { password } : {}),
    user_metadata: {
      nombre: username,
      updated_by: admin.id
    }
  });

  if (authUpdateError) {
    redirect("/admin/usuarios?error=editar-usuario");
  }

  const { error: profileUpdateError } = await service!
    .from("profiles")
    .update({
      email,
      nombre: username
    })
    .eq("id", userId);

  if (profileUpdateError) {
    redirect("/admin/usuarios?error=editar-usuario");
  }

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios?updated=1");
}

export async function deleteManagedUser(formData: FormData) {
  const admin = await requireProfile(["admin"]);
  const service = getSupabaseServiceClient();

  if (!service) {
    redirect("/admin/usuarios?error=service-role");
  }

  const userId = cleanText(formData.get("userId"));

  if (!userId || userId === admin.id) {
    redirect("/admin/usuarios?error=no-admin-delete");
  }

  await service!.from("profiles").delete().eq("id", userId);

  const { error: authDeleteError } = await service!.auth.admin.deleteUser(userId);

  if (authDeleteError) {
    redirect("/admin/usuarios?error=eliminar-usuario");
  }

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios?deleted=1");
}
