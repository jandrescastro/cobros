import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/auth-cookies";
import type { AppProfile, AppRole } from "@/lib/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type AuthSession = {
  accessToken: string;
  refreshToken: string | null;
  userId: string;
  email: string;
};

export async function getCurrentSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value ?? null;

  if (!accessToken) {
    return null;
  }

  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
    error
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
    userId: user.id,
    email: user.email ?? ""
  };
}

export async function getCurrentProfile(): Promise<(AppProfile & { accessToken: string }) | null> {
  const session = await getCurrentSession();

  if (!session) {
    return null;
  }

  const supabase = getSupabaseServerClient(session.accessToken);

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, nombre, rol, gestiona_clientes_propios")
    .eq("id", session.userId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    ...data,
    accessToken: session.accessToken
  };
}

export async function requireProfile(allowedRoles?: AppRole[]) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (allowedRoles && !allowedRoles.includes(profile.rol)) {
    redirect(profile.rol === "admin" ? "/admin/usuarios" : "/");
  }

  return profile;
}

export async function setSessionCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies();

  cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });

  cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

export async function clearSessionCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
}
