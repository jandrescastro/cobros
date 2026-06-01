import { NextRequest } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { buildCobrosDelMes, getResumenDashboard } from "@/lib/billing";
import { resolveSelectedPeriod } from "@/lib/period";
import { formatCurrency, monthLabel, titleCase } from "@/lib/utils";

export const runtime = "nodejs";

function xmlEscape(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cell(value: string | number | null | undefined, type: "String" | "Number" = "String") {
  if (type === "Number" && (value == null || value === "")) {
    return "<Cell/>";
  }

  return `<Cell><Data ss:Type="${type}">${xmlEscape(value)}</Data></Cell>`;
}

function row(values: Array<string | number | null | undefined>, numericIndexes: number[] = []) {
  return `<Row>${values.map((value, index) => cell(value, numericIndexes.includes(index) ? "Number" : "String")).join("")}</Row>`;
}

function worksheet(name: string, rows: string[]) {
  return `<Worksheet ss:Name="${xmlEscape(name)}"><Table>${rows.join("")}</Table></Worksheet>`;
}

function fileSafePeriodLabel(year: number, month: number) {
  return monthLabel(year, month)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export async function GET(request: NextRequest) {
  const profile = await getCurrentProfile();

  if (!profile || profile.rol !== "collector") {
    return new Response("No autorizado", { status: 401 });
  }

  const { year, month } = resolveSelectedPeriod(request.nextUrl.searchParams);
  const [resumen, cobrosDelMes] = await Promise.all([
    getResumenDashboard(year, month),
    buildCobrosDelMes(year, month)
  ]);
  const periodo = titleCase(monthLabel(year, month));
  const totalPeriodo = resumen.montoCobrado + resumen.montoPendiente;
  const totalAbonado = cobrosDelMes.reduce((total, item) => total + item.cobro.monto_abonado, 0);

  const resumenRows = [
    row(["Metrica", "Valor"]),
    row(["Periodo", periodo]),
    row(["Clientes activos", resumen.totalClientesActivos], [1]),
    row(["Clientes pendientes", resumen.clientesPendientes], [1]),
    row(["Cobrado", resumen.montoCobrado], [1]),
    row(["Pendiente", resumen.montoPendiente], [1]),
    row(["Abonado registrado", totalAbonado], [1]),
    row(["Total del periodo", totalPeriodo], [1])
  ];

  const detalleRows = [
    row([
      "Cliente",
      "Responsable",
      "Dia de cobro",
      "Estado",
      "Total",
      "Abonado",
      "Saldo",
      "Fecha de pago",
      "Observacion"
    ]),
    ...cobrosDelMes.map(({ cliente, cobro }) =>
      row(
        [
          cliente.nombre,
          cliente.responsable_cobro ?? "",
          cliente.dia_cobro_sugerido ?? "",
          cobro.estado,
          cobro.monto_original,
          cobro.monto_abonado,
          cobro.estado === "pagado" ? 0 : cobro.monto,
          cobro.fecha_pago ?? "",
          cobro.observacion ?? ""
        ],
        [2, 4, 5, 6]
      )
    )
  ];

  const printableRows = [
    row(["Periodo", periodo]),
    row(["Cobrado", formatCurrency(resumen.montoCobrado)]),
    row(["Pendiente", formatCurrency(resumen.montoPendiente)])
  ];

  const workbook = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:html="http://www.w3.org/TR/REC-html40">
  ${worksheet("Resumen", resumenRows)}
  ${worksheet("Detalle", [...printableRows, row([]), ...detalleRows])}
</Workbook>`;

  return new Response(workbook, {
    headers: {
      "Content-Disposition": `attachment; filename="metricas-${fileSafePeriodLabel(year, month)}.xls"`,
      "Content-Type": "application/vnd.ms-excel; charset=utf-8"
    }
  });
}
