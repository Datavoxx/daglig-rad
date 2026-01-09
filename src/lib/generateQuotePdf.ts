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
  const boxHeight = 110;
  const boxY = yPos;
  
  // Main box with shadow effect
  doc.setFillColor(250, 252, 254); // Very light teal tint
  doc.roundedRect(margin, boxY, pageWidth - margin * 2, boxHeight, 6, 6, "F");
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, boxY, pageWidth - margin * 2, boxHeight, 6, 6, "S");

  yPos = boxY + 18;
  doc.setFontSize(15);
  doc.setTextColor(...PRIMARY);
  doc.setFont("helvetica", "bold");
  doc.text("Prissammanfattning", pageWidth / 2, yPos, { align: "center" });

  yPos += 18;
  const leftCol = margin + 20;
  const rightCol = pageWidth - margin - 20;

  const addPriceRow = (label: string, value: string, isBold = false) => {
    doc.setFontSize(11);
    if (isBold) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...DARK);
    } else {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...MUTED);
    }
    doc.text(label, leftCol, yPos);
    doc.text(value, rightCol, yPos, { align: "right" });
    yPos += 9;
  };

  addPriceRow("Arbetskostnad", `${formatNumber(data.laborCost)} kr`);
  addPriceRow("Materialkostnad", `${formatNumber(data.materialCost)} kr`);
  addPriceRow("Underentreprenörer", `${formatNumber(data.subcontractorCost)} kr`);

  yPos += 2;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(leftCol, yPos, rightCol, yPos);
  yPos += 10;

  addPriceRow("Totalt exkl. moms", `${formatNumber(totalExclVat)} kr`, true);
  addPriceRow("Moms (25%)", `${formatNumber(vat)} kr`);

  // Total highlight box
  yPos += 4;
  const totalBoxY = yPos - 5;
  const totalBoxHeight = 14;
  doc.setFillColor(...PRIMARY);
  doc.roundedRect(leftCol - 8, totalBoxY, rightCol - leftCol + 16, totalBoxHeight, 3, 3, "F");
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("Totalt inkl. moms", leftCol, yPos + 2);
  doc.text(`${formatNumber(totalInclVat)} kr`, rightCol, yPos + 2, { align: "right" });

  // Footer - only page number
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "normal");
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
