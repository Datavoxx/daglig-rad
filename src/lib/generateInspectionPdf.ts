import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface Checkpoint {
  id: string;
  text: string;
  required: boolean;
  result: "ok" | "deviation" | "na" | null;
  comment: string;
  aiPrefilled?: boolean;
}

interface Inspection {
  id: string;
  template_name: string;
  template_category: string;
  inspection_date: string;
  inspector_name: string | null;
  inspector_company: string | null;
  notes: string | null;
  status: string;
  checkpoints: Checkpoint[];
  project: { name: string; client_name: string | null };
}

// Colors
const PRIMARY: [number, number, number] = [13, 148, 136]; // teal-600
const DARK: [number, number, number] = [30, 41, 59]; // slate-800
const MUTED: [number, number, number] = [100, 116, 139]; // slate-500
const GREEN: [number, number, number] = [22, 163, 74]; // green-600
const RED: [number, number, number] = [220, 38, 38]; // red-600

const statusLabels: Record<string, string> = {
  draft: "Utkast",
  completed: "Slutförd",
  approved: "Godkänd",
};

export async function generateInspectionPdf(inspection: Inspection): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPos = 20;

  // Header
  doc.setFontSize(24);
  doc.setTextColor(...PRIMARY);
  doc.text("EGENKONTROLL", margin, yPos);
  yPos += 10;

  // Template name
  doc.setFontSize(16);
  doc.setTextColor(...DARK);
  doc.text(inspection.template_name, margin, yPos);
  yPos += 7;

  // Project and date
  doc.setFontSize(11);
  doc.setTextColor(...MUTED);
  doc.text(`Projekt: ${inspection.project?.name || "—"}`, margin, yPos);
  const dateStr = format(new Date(inspection.inspection_date), "d MMMM yyyy", { locale: sv });
  doc.text(`Datum: ${dateStr}`, pageWidth - margin, yPos, { align: "right" });
  yPos += 6;

  // Client and category
  if (inspection.project?.client_name) {
    doc.text(`Kund: ${inspection.project.client_name}`, margin, yPos);
  }
  doc.text(`Kategori: ${inspection.template_category}`, pageWidth - margin, yPos, { align: "right" });
  yPos += 10;

  // Divider line
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Summary section
  const completedCount = inspection.checkpoints.filter((cp) => cp.result !== null).length;
  const okCount = inspection.checkpoints.filter((cp) => cp.result === "ok").length;
  const deviationCount = inspection.checkpoints.filter((cp) => cp.result === "deviation").length;
  const naCount = inspection.checkpoints.filter((cp) => cp.result === "na").length;

  doc.setFontSize(14);
  doc.setTextColor(...DARK);
  doc.text("SAMMANFATTNING", margin, yPos);
  yPos += 6;

  autoTable(doc, {
    startY: yPos,
    margin: { left: margin, right: margin },
    head: [],
    body: [
      ["Status", statusLabels[inspection.status] || inspection.status],
      ["Ifyllda punkter", `${completedCount} av ${inspection.checkpoints.length}`],
      ["Godkända", okCount.toString()],
      ["Avvikelser", deviationCount.toString()],
      ["Ej tillämpliga", naCount.toString()],
    ],
    theme: "plain",
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    columnStyles: {
      0: { textColor: MUTED, cellWidth: 50 },
      1: { textColor: DARK, fontStyle: "bold" },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Inspector info
  if (inspection.inspector_name || inspection.inspector_company) {
    doc.setFontSize(14);
    doc.setTextColor(...DARK);
    doc.text("KONTROLLANT", margin, yPos);
    yPos += 6;

    const inspectorRows: string[][] = [];
    if (inspection.inspector_name) {
      inspectorRows.push(["Namn", inspection.inspector_name]);
    }
    if (inspection.inspector_company) {
      inspectorRows.push(["Företag", inspection.inspector_company]);
    }

    autoTable(doc, {
      startY: yPos,
      margin: { left: margin, right: margin },
      head: [],
      body: inspectorRows,
      theme: "plain",
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      columnStyles: {
        0: { textColor: MUTED, cellWidth: 50 },
        1: { textColor: DARK },
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Checkpoints section
  doc.setFontSize(14);
  doc.setTextColor(...DARK);
  doc.text("KONTROLLPUNKTER", margin, yPos);
  yPos += 6;

  const checkpointRows = inspection.checkpoints.map((cp, index) => {
    let resultText = "—";
    let resultColor: [number, number, number] = MUTED;

    switch (cp.result) {
      case "ok":
        resultText = "✓ OK";
        resultColor = GREEN;
        break;
      case "deviation":
        resultText = "✗ Avvikelse";
        resultColor = RED;
        break;
      case "na":
        resultText = "— Ej tillämplig";
        resultColor = MUTED;
        break;
    }

    return [
      `${index + 1}.`,
      cp.text + (cp.required ? " *" : ""),
      resultText,
      cp.comment || "",
    ];
  });

  autoTable(doc, {
    startY: yPos,
    margin: { left: margin, right: margin },
    head: [["Nr", "Kontrollpunkt", "Resultat", "Kommentar"]],
    body: checkpointRows,
    theme: "striped",
    headStyles: {
      fillColor: PRIMARY,
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
      overflow: "linebreak",
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 70 },
      2: { cellWidth: 30, halign: "center" },
      3: { cellWidth: 55 },
    },
    didParseCell: (data) => {
      // Color the result column based on value
      if (data.column.index === 2 && data.section === "body") {
        const text = data.cell.raw as string;
        if (text.includes("OK")) {
          data.cell.styles.textColor = GREEN;
          data.cell.styles.fontStyle = "bold";
        } else if (text.includes("Avvikelse")) {
          data.cell.styles.textColor = RED;
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Deviations detail section
  const deviations = inspection.checkpoints.filter((cp) => cp.result === "deviation" && cp.comment);
  if (deviations.length > 0) {
    // Check if we need a new page
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(...DARK);
    doc.text("AVVIKELSER - DETALJER", margin, yPos);
    yPos += 6;

    autoTable(doc, {
      startY: yPos,
      margin: { left: margin, right: margin },
      head: [["Kontrollpunkt", "Avvikelse"]],
      body: deviations.map((cp) => [cp.text, cp.comment]),
      theme: "striped",
      headStyles: {
        fillColor: RED,
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: "bold",
      },
      styles: {
        fontSize: 10,
        cellPadding: 4,
        overflow: "linebreak",
      },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 95 },
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Notes section
  if (inspection.notes) {
    // Check if we need a new page
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(...DARK);
    doc.text("ANTECKNINGAR", margin, yPos);
    yPos += 6;

    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    const splitNotes = doc.splitTextToSize(inspection.notes, pageWidth - margin * 2);
    doc.text(splitNotes, margin, yPos);
    yPos += splitNotes.length * 5 + 10;
  }

  // Legend
  if (yPos > 260) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("* = Obligatorisk kontrollpunkt", margin, yPos);

  // Footer on each page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
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
  const projectName = (inspection.project?.name || "egenkontroll")
    .toLowerCase()
    .replace(/[^a-zåäö0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  const dateForFile = format(new Date(inspection.inspection_date), "yyyy-MM-dd");
  const templateName = inspection.template_name
    .toLowerCase()
    .replace(/[^a-zåäö0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  const filename = `egenkontroll_${projectName}_${templateName}_${dateForFile}.pdf`;

  doc.save(filename);
}
