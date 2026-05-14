const PERIOD_TIME_ZONE = "America/Bogota";

type SearchParamsReader = {
  get(name: string): string | null;
};

type PeriodParams =
  | SearchParamsReader
  | {
      anio?: string | null;
      mes?: string | null;
    }
  | null
  | undefined;

function isSearchParamsReader(value: PeriodParams): value is SearchParamsReader {
  return Boolean(value) && typeof (value as SearchParamsReader).get === "function";
}

function getNumericPeriodPart(part: "year" | "month", referenceDate: Date) {
  const value = new Intl.DateTimeFormat("en-US", {
    timeZone: PERIOD_TIME_ZONE,
    [part]: "numeric"
  }).format(referenceDate);

  return Number(value);
}

function parsePositiveInteger(value: string | null | undefined) {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function getCurrentPeriod(referenceDate = new Date()) {
  return {
    year: getNumericPeriodPart("year", referenceDate),
    month: getNumericPeriodPart("month", referenceDate)
  };
}

export function resolveSelectedPeriod(params?: PeriodParams) {
  const currentPeriod = getCurrentPeriod();
  const rawYear = isSearchParamsReader(params) ? params.get("anio") : params?.anio;
  const rawMonth = isSearchParamsReader(params) ? params.get("mes") : params?.mes;
  const selectedYear = parsePositiveInteger(rawYear) ?? currentPeriod.year;
  const selectedMonth = parsePositiveInteger(rawMonth);

  return {
    year: selectedYear,
    month: selectedMonth && selectedMonth >= 1 && selectedMonth <= 12 ? selectedMonth : currentPeriod.month
  };
}

export function buildPeriodHref(
  pathname: string,
  year: number,
  month: number,
  extraParams?: Record<string, string | number | null | undefined>
) {
  const params = new URLSearchParams({
    anio: String(year),
    mes: String(month)
  });

  if (extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
      if (value == null || value === "") {
        continue;
      }

      params.set(key, String(value));
    }
  }

  return `${pathname}?${params.toString()}`;
}
