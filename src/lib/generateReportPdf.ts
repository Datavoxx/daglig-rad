import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { getCompanyLogoBase64, PDF_COLORS } from "./pdfUtils";

interface DailyReport {
  id: string;
  report_date: string;
  headcount: number | null;
  roles: string[];
  hours_per_person: number | null;
  total_hours: number | null;
  work_items: string[];
  deviations: Array<{ type: string; description: string; hours: number | null }>;
  ata: {
    has_ata: boolean;
    items: Array<{ reason: string; consequence: string; estimated_hours: number | null }>;
  } | null;
  extra_work: string[];
  materials_delivered: string[];
  materials_missing: string[];
  notes: string | null;
  original_transcript: string | null;
  project: { id: string; name: string; client_name: string | null };
}

interface CompanySettings {
  company_name: string | null;
  logo_url: string | null;
}

const deviationTypes: Record<string, string> = {
  waiting_time: "Väntetid",
  material_delay: "Materialförsening",
  weather: "Väder",
  coordination: "Samordning",
  equipment: "Utrustning",
  safety: "Säkerhet",
  quality: "Kvalitet",
  other: "Övrigt",
};

export async function generateReportPdf(
  report: DailyReport,
  companySettings?: CompanySettings | null
): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPos = 15;

  // Get logo
  const logoBase64 = await getCompanyLogoBase64(companySettings?.logo_url || null);

  // Logo in top left
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "AUTO", margin, yPos, 35, 18, undefined, "FAST");
      // Company name on right if logo exists
      if (companySettings?.company_name) {
        doc.setFontSize(10);
        doc.setTextColor(...PDF_COLORS.MUTED);
        doc.text(companySettings.company_name, pageWidth - margin, yPos + 10, { align: "right" });
      }
      yPos += 25;
    } catch (e) {
      console.error("Error adding logo:", e);
      yPos += 5;
    }
  }

  // Header
  doc.setFontSize(24);
  doc.setTextColor(...PDF_COLORS.PRIMARY);
  doc.text("DAGRAPPORT", margin, yPos);
  yPos += 10;

  // Project name
  doc.setFontSize(16);
  doc.setTextColor(...PDF_COLORS.DARK);
  doc.text(report.project?.name || "Projekt", margin, yPos);
  yPos += 7;

  // Date and client
  doc.setFontSize(11);
  doc.setTextColor(...PDF_COLORS.MUTED);
  const dateStr = format(new Date(report.report_date), "d MMMM yyyy", { locale: sv });
  doc.text(`Datum: ${dateStr}`, margin, yPos);
  if (report.project?.client_name) {
    doc.text(`Kund: ${report.project.client_name}`, pageWidth - margin, yPos, { align: "right" });
  }
  yPos += 12;

  // Divider line
  doc.setDrawColor(...PDF_COLORS.PRIMARY);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Crew section
  doc.setFontSize(14);
  doc.setTextColor(...PDF_COLORS.DARK);
  doc.text("BEMANNING", margin, yPos);
  yPos += 6;

  autoTable(doc, {
    startY: yPos,
    margin: { left: margin, right: margin },
    head: [],
    body: [
      ["Antal personer", report.headcount?.toString() || "—"],
      ["Timmar/person", report.hours_per_person ? `${report.hours_per_person}h` : "—"],
      ["Totala timmar", report.total_hours ? `${report.total_hours}h` : "—"],
      ["Roller", report.roles?.length > 0 ? report.roles.join(", ") : "—"],
    ],
    theme: "plain",
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    columnStyles: {
      0: { textColor: PDF_COLORS.MUTED, cellWidth: 50 },
      1: { textColor: PDF_COLORS.DARK, fontStyle: "bold" },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Work items section
  if (report.work_items?.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(...PDF_COLORS.DARK);
    doc.text("UTFÖRT ARBETE", margin, yPos);
    yPos += 6;

    autoTable(doc, {
      startY: yPos,
      margin: { left: margin, right: margin },
      head: [],
      body: report.work_items.map((item) => [`• ${item}`]),
      theme: "plain",
      styles: {
        fontSize: 10,
        cellPadding: 2,
        textColor: PDF_COLORS.DARK,
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Deviations section
  if (report.deviations?.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(...PDF_COLORS.DARK);
    doc.text("AVVIKELSER", margin, yPos);
    yPos += 6;

    autoTable(doc, {
      startY: yPos,
      margin: { left: margin, right: margin },
      head: [["Typ", "Beskrivning", "Timmar"]],
      body: report.deviations.map((d) => [
        deviationTypes[d.type] || d.type,
        d.description,
        d.hours ? `${d.hours}h` : "—",
      ]),
      theme: "striped",
      headStyles: {
        fillColor: PDF_COLORS.PRIMARY,
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: "bold",
      },
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 35 },
        2: { cellWidth: 20, halign: "center" },
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // ÄTA section
  if (report.ata?.has_ata && report.ata.items?.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(...PDF_COLORS.DARK);
    doc.text("ÄTA (ÄNDRINGS- OCH TILLÄGGSARBETEN)", margin, yPos);
    yPos += 6;

    autoTable(doc, {
      startY: yPos,
      margin: { left: margin, right: margin },
      head: [["Anledning", "Konsekvens", "Timmar"]],
      body: report.ata.items.map((item) => [
        item.reason,
        item.consequence,
        item.estimated_hours ? `${item.estimated_hours}h` : "—",
      ]),
      theme: "striped",
      headStyles: {
        fillColor: PDF_COLORS.BLUE,
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: "bold",
      },
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      columnStyles: {
        2: { cellWidth: 20, halign: "center" },
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Materials section
  if (report.materials_delivered?.length > 0 || report.materials_missing?.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(...PDF_COLORS.DARK);
    doc.text("MATERIAL", margin, yPos);
    yPos += 6;

    const materialRows: string[][] = [];
    if (report.materials_delivered?.length > 0) {
      materialRows.push(["Levererat", report.materials_delivered.join(", ")]);
    }
    if (report.materials_missing?.length > 0) {
      materialRows.push(["Saknas", report.materials_missing.join(", ")]);
    }

    autoTable(doc, {
      startY: yPos,
      margin: { left: margin, right: margin },
      head: [],
      body: materialRows,
      theme: "plain",
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      columnStyles: {
        0: { textColor: PDF_COLORS.MUTED, cellWidth: 30, fontStyle: "bold" },
        1: { textColor: PDF_COLORS.DARK },
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Notes section
  if (report.notes) {
    // Check if we need a new page
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(...PDF_COLORS.DARK);
    doc.text("ANTECKNINGAR", margin, yPos);
    yPos += 6;

    doc.setFontSize(10);
    doc.setTextColor(...PDF_COLORS.DARK);
    const splitNotes = doc.splitTextToSize(report.notes, pageWidth - margin * 2);
    doc.text(splitNotes, margin, yPos);
    yPos += splitNotes.length * 5 + 10;
  }

  // Footer on each page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...PDF_COLORS.MUTED);
    doc.text(
      `Genererad ${format(new Date(), "yyyy-MM-dd HH:mm")}`,
      margin,
      doc.internal.pageSize.getHeight() - 10
    );
    doc.text(
      `Sida ${i} av ${pageCount}`,
      pageWidth - margin,
      doc.internal.pageSize.getHeight() - 10,
      { align: "right" }
    );
  }

  // Generate filename
  const projectName = (report.project?.name || "rapport")
    .toLowerCase()
    .replace(/[^a-zåäö0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  const dateForFile = format(new Date(report.report_date), "yyyy-MM-dd");
  const filename = `dagrapport_${projectName}_${dateForFile}.pdf`;

  doc.save(filename);
}
