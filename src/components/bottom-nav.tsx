"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CreditCard, LayoutDashboard, ShieldCheck, TriangleAlert, Users } from "lucide-react";
import type { AppRole } from "@/lib/types";
import { cn } from "@/lib/utils";

type BottomNavProps = {
  role: AppRole;
};

const collectorItems = [
  { href: "/", label: "Inicio", icon: LayoutDashboard },
  { href: "/mes", label: "Mes", icon: CreditCard },
  { href: "/metricas", label: "Metricas", icon: BarChart3 },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/pendientes", label: "Pendientes", icon: TriangleAlert }
];

const adminItems = [{ href: "/admin/usuarios", label: "Usuarios", icon: ShieldCheck }];

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const items = role === "admin" ? adminItems : collectorItems;
  const columns = role === "admin" ? "grid-cols-1" : "grid-cols-5";

  return (
    <nav className="fixed bottom-4 left-1/2 z-20 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 rounded-[1.75rem] border border-[#d8e4ea] bg-white/95 p-2 shadow-soft backdrop-blur">
      <ul className={cn("grid gap-1", columns)}>
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.06em] transition",
                  active ? "bg-ink text-white" : "text-slate hover:bg-sand"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
