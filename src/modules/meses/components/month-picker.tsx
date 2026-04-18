"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn, getMonthOptions, monthLabel, titleCase } from "@/lib/utils";

type MonthPickerProps = {
  year: number;
  month: number;
};

const monthOptions = getMonthOptions();

export function MonthPicker({ year, month }: MonthPickerProps) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(year);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleSelectMonth(selectedMonth: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("anio", String(viewYear));
    params.set("mes", String(selectedMonth));
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        className="flex w-full items-center gap-3 rounded-card bg-ink px-4 py-4 text-left text-white shadow-soft transition hover:bg-ink/95"
        onClick={() => {
          setViewYear(year);
          setOpen(true);
        }}
      >
        <span className="rounded-full bg-white/15 p-2">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 2v4" />
            <path d="M16 2v4" />
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M3 10h18" />
          </svg>
        </span>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-[0.2em] text-white/70">Periodo actual</p>
          <p className="text-lg font-semibold">{titleCase(monthLabel(year, month))}</p>
        </div>
      </button>

      {open ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-sm rounded-[2rem] bg-white p-5 shadow-soft">
            <div className="mb-5 flex items-center justify-between">
              <button
                type="button"
                className="rounded-full p-2 text-slate transition hover:bg-sand"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-full p-2 text-slate transition hover:bg-sand"
                  onClick={() => setViewYear((current) => current - 1)}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <p className="min-w-20 text-center text-2xl font-semibold text-ink">{viewYear}</p>
                <button
                  type="button"
                  className="rounded-full p-2 text-slate transition hover:bg-sand"
                  onClick={() => setViewYear((current) => current + 1)}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <div className="h-9 w-9" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {monthOptions.map((item) => {
                const selected = year === viewYear && month === item.value;

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => handleSelectMonth(item.value)}
                    className={cn(
                      "rounded-2xl border px-3 py-6 text-center text-sm font-semibold tracking-wide transition",
                      selected
                        ? "border-ink bg-ink text-white"
                        : "border-[#D7E3EA] bg-[#F7FAFC] text-ink hover:border-ink/30 hover:bg-sand"
                    )}
                  >
                    {item.shortLabel}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
