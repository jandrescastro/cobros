import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(value);
}

export function parseCurrencyInput(value: string) {
  const normalized = value.trim().replace(/\s+/g, "").replace(/\./g, "").replace(/,/g, ".");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function monthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat("es-CO", {
    month: "long",
    year: "numeric"
  }).format(new Date(year, month - 1, 1));
}

export function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function getMonthOptions(locale = "es-CO") {
  return Array.from({ length: 12 }, (_, index) => ({
    value: index + 1,
    shortLabel: new Intl.DateTimeFormat(locale, { month: "short" })
      .format(new Date(2026, index, 1))
      .replace(".", "")
      .toUpperCase(),
    fullLabel: new Intl.DateTimeFormat(locale, { month: "long" }).format(new Date(2026, index, 1))
  }));
}
