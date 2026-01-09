import jsPDF from "jspdf";
import { format, addDays } from "date-fns";

interface QuoteData {
  projectName: string;
  scope: string;
  laborCost: number;
  materialCost: number;
  subcontractorCost: number;
  markupPercent: number;
  validDays?: number;
  version?: number;
}

// Colors
const PRIMARY: [number, number, number] = [13, 148, 136]; // teal-600
const DARK: [number, number, number] = [30, 41, 59]; // slate-800
const MUTED: [number, number, number] = [100, 116, 139]; // slate-500

export async function generateQuotePdf(data: QuoteData): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const validDays = data.validDays || 30;

  // Calculate totals
  const subtotal = data.laborCost + data.materialCost + data.subcontractorCost;
  const markup = subtotal * (data.markupPercent / 100);
  const totalExclVat = subtotal + markup;
  const vat = totalExclVat * 0.25;
  const totalInclVat = totalExclVat + vat;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("sv-SE").format(Math.round(num));
  };

  // Header bar
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pageWidth, 10, "F");

  // Title
  let yPos = 45;
  doc.setFontSize(36);
  doc.setTextColor(...PRIMARY);
  doc.text("OFFERT", pageWidth / 2, yPos, { align: "center" });

  // Divider
  yPos += 12;
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(1);
  doc.line(pageWidth / 2 - 30, yPos, pageWidth / 2 + 30, yPos);

  // Project name
  yPos += 20;
  doc.setFontSize(24);
  doc.setTextColor(...DARK);
  doc.text(data.projectName, pageWidth / 2, yPos, { align: "center" });

  // Date and validity
  yPos += 12;
  doc.setFontSize(11);
  doc.setTextColor(...MUTED);
  const today = new Date();
  const validUntil = addDays(today, validDays);
  doc.text(
    `Datum: ${format(today, "yyyy-MM-dd")}  •  Giltig t.o.m. ${format(validUntil, "yyyy-MM-dd")}`,
    pageWidth / 2,
    yPos,
    { align: "center" }
  );

  // Scope section
  yPos += 30;
  doc.setFontSize(14);
  doc.setTextColor(...PRIMARY);
  doc.text("Omfattning", margin, yPos);

  yPos += 8;
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  const scopeLines = doc.splitTextToSize(data.scope || "Ej angiven", pageWidth - margin * 2);
  doc.text(scopeLines, margin, yPos);
  yPos += scopeLines.length * 6 + 20;

  // Price summary box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 95, 4, 4, "F");
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 95, 4, 4, "S");

  yPos += 15;
  doc.setFontSize(14);
  doc.setTextColor(...PRIMARY);
  doc.text("Prissammanfattning", pageWidth / 2, yPos, { align: "center" });

  yPos += 15;
  const leftCol = margin + 15;
  const rightCol = pageWidth - margin - 15;

  const addPriceRow = (label: string, value: string, isBold = false, isTotal = false) => {
    doc.setFontSize(isTotal ? 13 : 11);
    if (isBold || isTotal) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...(isTotal ? PRIMARY : DARK));
    } else {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...MUTED);
    }
    doc.text(label, leftCol, yPos);
    doc.text(value, rightCol, yPos, { align: "right" });
    yPos += isTotal ? 10 : 8;
  };

  addPriceRow("Arbetskostnad", `${formatNumber(data.laborCost)} kr`);
  addPriceRow("Materialkostnad", `${formatNumber(data.materialCost)} kr`);
  addPriceRow("Underentreprenörer", `${formatNumber(data.subcontractorCost)} kr`);

  yPos += 3;
  doc.setDrawColor(200, 200, 200);
  doc.line(leftCol, yPos, rightCol, yPos);
  yPos += 8;

  addPriceRow("Totalt exkl. moms", `${formatNumber(totalExclVat)} kr`, true);
  addPriceRow("Moms (25%)", `${formatNumber(vat)} kr`);

  yPos += 3;
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(1);
  doc.line(leftCol, yPos, rightCol, yPos);
  yPos += 10;

  addPriceRow("Totalt inkl. moms", `${formatNumber(totalInclVat)} kr`, true, true);

  // Conditions
  yPos += 25;
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "normal");
  doc.text("Villkor:", margin, yPos);
  yPos += 6;
  doc.text("• Priserna är baserade på beskrivna arbeten och kan justeras vid avvikelser", margin + 3, yPos);
  yPos += 5;
  doc.text("• Betalningsvillkor: 30 dagar netto", margin + 3, yPos);
  yPos += 5;
  doc.text(`• Offerten är giltig i ${validDays} dagar från ovan datum`, margin + 3, yPos);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(
    `Genererad ${format(new Date(), "yyyy-MM-dd HH:mm")}`,
    margin,
    pageHeight - 10
  );
  doc.text(
    "Sida 1 av 1",
    pageWidth - margin,
    pageHeight - 10,
    { align: "right" }
  );

  // Generate filename
  const projectName = data.projectName
    .toLowerCase()
    .replace(/[^a-zåäö0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  const dateForFile = format(new Date(), "yyyy-MM-dd");
  const filename = `offert_${projectName}_${dateForFile}.pdf`;

  doc.save(filename);
}
