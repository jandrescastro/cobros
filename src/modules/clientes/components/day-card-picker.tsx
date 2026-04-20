"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";

type DayCardPickerProps = {
  name: string;
  selectedDay?: number | null;
  required?: boolean;
};

export function DayCardPicker({ name, selectedDay, required = false }: DayCardPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDay, setCurrentDay] = useState<number | null>(selectedDay ?? 1);
  const leadingEmptyDays = 2;
  const calendarCells = [
    ...Array.from({ length: leadingEmptyDays }, (_, index) => ({ key: `empty-${index}`, day: null as number | null })),
    ...Array.from({ length: 31 }, (_, index) => ({ key: `day-${index + 1}`, day: index + 1 }))
  ];

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={currentDay ?? ""} required={required} />

      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="flex w-full items-center justify-between rounded-2xl border border-slate/15 bg-white px-4 py-3 text-left text-sm text-ink shadow-soft"
      >
        <span className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-slate" />
          {currentDay ? `Dia ${currentDay}` : "Seleccionar dia sugerido"}
        </span>
        <span className="text-xs font-semibold uppercase tracking-[0.1em] text-slate">
          {isOpen ? "Cerrar" : "Abrir"}
        </span>
      </button>

      {isOpen ? (
        <div className="space-y-3 rounded-2xl border border-slate/15 bg-white p-3 shadow-soft">
          <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-slate">
            <span>L</span>
            <span>M</span>
            <span>M</span>
            <span>J</span>
            <span>V</span>
            <span>S</span>
            <span>D</span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarCells.map(({ key, day }) =>
              day ? (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setCurrentDay(day);
                    setIsOpen(false);
                  }}
                  className={
                    currentDay === day
                      ? "flex aspect-square items-center justify-center rounded-2xl border border-[#ff5a4e] bg-[#ff5a4e] text-base font-bold text-white shadow-[0_10px_24px_rgba(255,90,78,0.22)]"
                      : "flex aspect-square items-center justify-center rounded-2xl border border-slate/15 bg-sand/35 text-base font-semibold text-ink transition hover:border-[#ffb2aa] hover:bg-[#fff4f2]"
                  }
                >
                  {day}
                </button>
              ) : (
                <span key={key} className="aspect-square rounded-2xl bg-transparent" />
              )
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
