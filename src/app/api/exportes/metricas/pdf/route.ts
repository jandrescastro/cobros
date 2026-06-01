import { NextRequest } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { buildCobrosDelMes, getResumenDashboard } from "@/lib/billing";
import { resolveSelectedPeriod } from "@/lib/period";
import { formatCurrency, monthLabel, titleCase } from "@/lib/utils";

export const runtime = "nodejs";

type PdfLine = {
  x: number;
  y: number;
  text: string;
  size?: number;
  font?: "F1" | "F2" | "F3";
};

function safePdfText(value: string | number | null | undefined, maxLength = 90) {
  const text = String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
}

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function fileSafePeriodLabel(year: number, month: number) {
  return monthLabel(year, month)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function renderPage(lines: PdfLine[]) {
  return lines
    .map(({ x, y, text, size = 10, font = "F1" }) => `BT /${font} ${size} Tf ${x} ${y} Td (${escapePdfText(safePdfText(text))}) Tj ET`)
    .join("\n");
}

function buildPdf(pageContents: string[]) {
  const objects: string[] = [];
  const pageKids = pageContents.map((_, index) => `${3 + index * 2} 0 R`).join(" ");

  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = `<< /Type /Pages /Kids [${pageKids}] /Count ${pageContents.length} >>`;

  pageContents.forEach((content, index) => {
    const pageObjectId = 3 + index * 2;
    const contentObjectId = pageObjectId + 1;

    objects[pageObjectId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] ` +
      `/Resources << /Font << ` +
      `/F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> ` +
      `/F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> ` +
      `/F3 << /Type /Font /Subtype /Type1 /BaseFont /Courier >> ` +
      `>> >> /Contents ${contentObjectId} 0 R >>`;
    objects[contentObjectId] = `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`;
  });

  let output = "%PDF-1.4\n";
  const offsets = [0];

  for (let index = 1; index < objects.length; index += 1) {
    offsets[index] = Buffer.byteLength(output, "latin1");
    output += `${index} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(output, "latin1");
  output += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;

  for (let index = 1; index < objects.length; index += 1) {
    output += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }

  output += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(output, "latin1");
}

function pageHeader(periodo: string, pageNumber: number): PdfLine[] {
  return [
    { x: 48, y: 744, text: "Metricas de cobros", size: 18, font: "F2" as const },
    { x: 48, y: 724, text: `Periodo: ${periodo}`, size: 11 },
    { x: 512, y: 744, text: `Pag. ${pageNumber}`, size: 9 }
  ];
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
  const rows = cobrosDelMes.map(({ cliente, cobro }) => ({
    cliente: cliente.nombre,
    estado: cobro.estado,
    total: formatCurrency(cobro.monto_original),
    abonado: formatCurrency(cobro.monto_abonado),
    saldo: formatCurrency(cobro.estado === "pagado" ? 0 : cobro.monto)
  }));

  const pages: PdfLine[][] = [];
  let currentPage = pageHeader(periodo, 1);
  let y = 686;

  currentPage.push(
    { x: 48, y: 694, text: `Cobrado: ${formatCurrency(resumen.montoCobrado)}`, size: 11, font: "F2" },
    { x: 250, y: 694, text: `Pendiente: ${formatCurrency(resumen.montoPendiente)}`, size: 11, font: "F2" },
    { x: 48, y: 668, text: "Cliente", size: 9, font: "F2" },
    { x: 226, y: 668, text: "Estado", size: 9, font: "F2" },
    { x: 300, y: 668, text: "Total", size: 9, font: "F2" },
    { x: 390, y: 668, text: "Abonado", size: 9, font: "F2" },
    { x: 486, y: 668, text: "Saldo", size: 9, font: "F2" }
  );

  for (const item of rows) {
    if (y < 60) {
      pages.push(currentPage);
      currentPage = pageHeader(periodo, pages.length + 1);
      currentPage.push(
        { x: 48, y: 698, text: "Cliente", size: 9, font: "F2" },
        { x: 226, y: 698, text: "Estado", size: 9, font: "F2" },
        { x: 300, y: 698, text: "Total", size: 9, font: "F2" },
        { x: 390, y: 698, text: "Abonado", size: 9, font: "F2" },
        { x: 486, y: 698, text: "Saldo", size: 9, font: "F2" }
      );
      y = 676;
    }

    currentPage.push(
      { x: 48, y, text: item.cliente, size: 8, font: "F3" },
      { x: 226, y, text: item.estado, size: 8, font: "F3" },
      { x: 300, y, text: item.total, size: 8, font: "F3" },
      { x: 390, y, text: item.abonado, size: 8, font: "F3" },
      { x: 486, y, text: item.saldo, size: 8, font: "F3" }
    );
    y -= 16;
  }

  if (rows.length === 0) {
    currentPage.push({ x: 48, y: 642, text: "No hay cobros para este periodo.", size: 10 });
  }

  pages.push(currentPage);

  return new Response(buildPdf(pages.map(renderPage)), {
    headers: {
      "Content-Disposition": `attachment; filename="metricas-${fileSafePeriodLabel(year, month)}.pdf"`,
      "Content-Type": "application/pdf"
    }
  });
}
