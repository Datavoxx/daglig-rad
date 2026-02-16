import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

interface EstimateItem {
  moment: string;
  type: "labor" | "material" | "subcontractor";
  quantity: number | null;
  unit: string;
  hours: number | null;
  unit_price: number;
  subtotal: number;
  comment: string;
  uncertainty: "low" | "medium" | "high";
}

interface EstimateData {
  projectName: string;
  scope: string;
  assumptions: string[];
  uncertainties: string[];
  items: EstimateItem[];
  markupPercent: number;
  version?: number;
}

// Colors
const PRIMARY: [number, number, number] = [13, 148, 136]; // teal-600
const DARK: [number, number, number] = [30, 41, 59]; // slate-800
const MUTED: [number, number, number] = [100, 116, 139]; // slate-500
const WHITE: [number, number, number] = [255, 255, 255];

const TYPE_LABELS: Record<string, string> = {
  labor: "Arbete",
  material: "Material",
  subcontractor: "UE",
};

const UNCERTAINTY_LABELS: Record<string, string> = {
  low: "Låg",
  medium: "Medel",
  high: "Hög",
};

export async function generateEstimatePdf(data: EstimateData): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // Calculate totals
  const laborCost = data.items
    .filter((item) => item.type === "labor")
    .reduce((sum, item) => sum + (item.subtotal || 0), 0);
  const materialCost = data.items
    .filter((item) => item.type === "material")
    .reduce((sum, item) => sum + (item.subtotal || 0), 0);
  const subcontractorCost = data.items
    .filter((item) => item.type === "subcontractor")
    .reduce((sum, item) => sum + (item.subtotal || 0), 0);
  const subtotal = laborCost + materialCost + subcontractorCost;
  const markup = subtotal * (data.markupPercent / 100);
  const totalExclVat = subtotal + markup;
  const vat = totalExclVat * 0.25;
  const totalInclVat = totalExclVat + vat;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("sv-SE").format(Math.round(num));
  };

  // === PAGE 1: Cover Page ===
  
  // Header bar
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pageWidth, 8, "F");
  
  // Title
  let yPos = 50;
  doc.setFontSize(32);
  doc.setTextColor(...PRIMARY);
  doc.text("PROJEKTOFFERT", pageWidth / 2, yPos, { align: "center" });
  
  // Divider
  yPos += 10;
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.8);
  doc.line(pageWidth / 2 - 35, yPos, pageWidth / 2 + 35, yPos);
  
  // Project name
  yPos += 18;
  doc.setFontSize(22);
  doc.setTextColor(...DARK);
  doc.text(data.projectName, pageWidth / 2, yPos, { align: "center" });
  
  // Version and date
  yPos += 12;
  doc.setFontSize(12);
  doc.setTextColor(...MUTED);
  const versionText = data.version ? `Version ${data.version} • ` : "";
  doc.text(`${versionText}${format(new Date(), "yyyy-MM-dd")}`, pageWidth / 2, yPos, { align: "center" });
  
  // Total box
  yPos += 25;
  doc.setFillColor(240, 253, 250); // teal-50
  doc.roundedRect(margin + 30, yPos, pageWidth - margin * 2 - 60, 35, 3, 3, "F");
  doc.setFontSize(14);
  doc.setTextColor(...MUTED);
  doc.text("Totalt inkl. moms", pageWidth / 2, yPos + 12, { align: "center" });
  doc.setFontSize(24);
  doc.setTextColor(...PRIMARY);
  doc.text(`${formatNumber(totalInclVat)} kr`, pageWidth / 2, yPos + 26, { align: "center" });
  
  // Scope
  yPos += 50;
  doc.setFontSize(12);
  doc.setTextColor(...DARK);
  doc.text("Omfattning", margin, yPos);
  yPos += 6;
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  const scopeLines = doc.splitTextToSize(data.scope, pageWidth - margin * 2);
  doc.text(scopeLines, margin, yPos);
  yPos += scopeLines.length * 5 + 10;
  
  // Assumptions
  if (data.assumptions.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(...DARK);
    doc.text("Antaganden", margin, yPos);
    yPos += 6;
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    const assumptionText = data.assumptions.join("\n");
    const assumptionLines = doc.splitTextToSize(assumptionText, pageWidth - margin * 2 - 2);
    doc.text(assumptionLines, margin + 2, yPos);
    yPos += assumptionLines.length * 5;
    yPos += 5;
  }
  
  // Uncertainties
  if (data.uncertainties.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(...DARK);
    doc.text("Osäkerheter", margin, yPos);
    yPos += 6;
    doc.setFontSize(9);
    doc.setTextColor(200, 100, 50);
    data.uncertainties.forEach((uncertainty) => {
      doc.text(`⚠ ${uncertainty}`, margin + 2, yPos);
      yPos += 5;
    });
  }
  
  // === PAGE 2: Estimate Table ===
  doc.addPage();
  
  yPos = 20;
  doc.setFontSize(16);
  doc.setTextColor(...PRIMARY);
  doc.text("OFFERTSPECIFIKATION", margin, yPos);
  
  yPos += 10;
  
  autoTable(doc, {
    startY: yPos,
    margin: { left: margin, right: margin },
    head: [["Moment", "Typ", "Antal", "Enhet", "Tim", "Á-pris", "Delkostnad", "Osäkerhet"]],
    body: data.items.map((item) => [
      item.moment,
      TYPE_LABELS[item.type] || item.type,
      item.quantity ?? "—",
      item.unit,
      item.hours ?? "—",
      `${formatNumber(item.unit_price)} kr`,
      `${formatNumber(item.subtotal)} kr`,
      UNCERTAINTY_LABELS[item.uncertainty] || item.uncertainty,
    ]),
    theme: "striped",
    headStyles: {
      fillColor: PRIMARY,
      textColor: WHITE,
      fontSize: 8,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 18 },
      2: { cellWidth: 15, halign: "right" },
      3: { cellWidth: 15 },
      4: { cellWidth: 12, halign: "right" },
      5: { cellWidth: 22, halign: "right" },
      6: { cellWidth: 25, halign: "right" },
      7: { cellWidth: 20, halign: "center" },
    },
  });
  
  // Totals section
  const tableEndY = (doc as any).lastAutoTable.finalY + 15;
  
  // Check if we need a new page for totals
  if (tableEndY > pageHeight - 80) {
    doc.addPage();
    yPos = 20;
  } else {
    yPos = tableEndY;
  }
  
  // Totals box
  const totalsX = pageWidth - margin - 80;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(totalsX - 5, yPos - 5, 85, 75, 2, 2, "F");
  
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  
  const addTotalRow = (label: string, value: string, bold = false) => {
    if (bold) {
      doc.setTextColor(...DARK);
      doc.setFont("helvetica", "bold");
    } else {
      doc.setTextColor(...MUTED);
      doc.setFont("helvetica", "normal");
    }
    doc.text(label, totalsX, yPos);
    doc.text(value, totalsX + 75, yPos, { align: "right" });
    yPos += 6;
  };
  
  addTotalRow("Arbetskostnad", `${formatNumber(laborCost)} kr`);
  addTotalRow("Materialkostnad", `${formatNumber(materialCost)} kr`);
  addTotalRow("UE-kostnad", `${formatNumber(subcontractorCost)} kr`);
  yPos += 2;
  doc.setDrawColor(200, 200, 200);
  doc.line(totalsX, yPos, totalsX + 75, yPos);
  yPos += 5;
  addTotalRow("Summa", `${formatNumber(subtotal)} kr`, true);
  if (data.markupPercent > 0) {
    addTotalRow(`Påslag (${data.markupPercent}%)`, `${formatNumber(markup)} kr`);
  }
  yPos += 2;
  doc.line(totalsX, yPos, totalsX + 75, yPos);
  yPos += 5;
  addTotalRow("Totalt exkl. moms", `${formatNumber(totalExclVat)} kr`, true);
  addTotalRow("Moms (25%)", `${formatNumber(vat)} kr`);
  yPos += 2;
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(1);
  doc.line(totalsX, yPos, totalsX + 75, yPos);
  yPos += 6;
  doc.setFontSize(12);
  doc.setTextColor(...PRIMARY);
  doc.setFont("helvetica", "bold");
  doc.text("Totalt inkl. moms", totalsX, yPos);
  doc.text(`${formatNumber(totalInclVat)} kr`, totalsX + 75, yPos, { align: "right" });
  
  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.setFont("helvetica", "normal");
    
    doc.text(
      `Genererad ${format(new Date(), "yyyy-MM-dd HH:mm")}`,
      margin,
      pageHeight - 10
    );
    
    doc.text(
      `Sida ${i} av ${pageCount}`,
      pageWidth - margin,
      pageHeight - 10,
      { align: "right" }
    );
  }
  
  // Generate filename
  const projectName = data.projectName
    .toLowerCase()
    .replace(/[^a-zåäö0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  const dateForFile = format(new Date(), "yyyy-MM-dd");
  const filename = `offert_${projectName}_${dateForFile}.pdf`;
  
  doc.save(filename);
}
