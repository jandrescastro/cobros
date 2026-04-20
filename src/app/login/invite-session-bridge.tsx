"use client";

import { useEffect, useState } from "react";

function extractHashParams(hash: string) {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  return new URLSearchParams(raw);
}

export function InviteSessionBridge() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = extractHashParams(window.location.hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (!accessToken || !refreshToken) {
      return;
    }

    const persistInviteSession = async () => {
      setMessage("Preparando tu invitacion...");

      const response = await fetch("/api/auth/invite-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          accessToken,
          refreshToken
        })
      });

      if (!response.ok) {
        setMessage("No pudimos preparar tu acceso. Abre de nuevo el enlace del correo.");
        return;
      }

      window.location.assign("/crear-contrasena");
    };

    void persistInviteSession();
  }, []);

  if (!message) {
    return null;
  }

  return <p className="mb-3 rounded-2xl bg-sand px-4 py-3 text-sm text-ink">{message}</p>;
}
