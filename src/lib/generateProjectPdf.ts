import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface Deviation {
  type: string;
  description: string;
  hours?: number | null;
}

interface AtaItem {
  reason: string;
  consequence: string;
  estimated_hours: number | null;
}

interface DailyReport {
  id: string;
  report_date: string;
  headcount: number | null;
  roles: string[] | null;
  hours_per_person: number | null;
  total_hours: number | null;
  work_items: string[] | null;
  deviations: Deviation[];
  ata: {
    has_ata: boolean;
    items: AtaItem[];
  } | null;
  materials_delivered: string[] | null;
  materials_missing: string[] | null;
  notes: string | null;
}

interface Project {
  name: string;
  client_name: string | null;
  address: string | null;
}

interface ProjectReport {
  project: Project;
  reports: DailyReport[];
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

// Colors (mutable arrays for jsPDF compatibility)
const PRIMARY: [number, number, number] = [13, 148, 136]; // teal-600
const DARK: [number, number, number] = [30, 41, 59]; // slate-800
const MUTED: [number, number, number] = [100, 116, 139]; // slate-500

export async function generateProjectPdf(data: ProjectReport): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // Beräkna statistik
  const totalHours = data.reports.reduce((sum, r) => sum + (r.total_hours || 0), 0);
  const totalDeviations = data.reports.reduce((sum, r) => sum + (r.deviations?.length || 0), 0);
  const totalAta = data.reports.filter(r => r.ata?.has_ata && r.ata.items?.length > 0).length;
  
  // Datumintervall
  const sortedReports = [...data.reports].sort(
    (a, b) => new Date(a.report_date).getTime() - new Date(b.report_date).getTime()
  );
  const firstDate = sortedReports[0]?.report_date;
  const lastDate = sortedReports[sortedReports.length - 1]?.report_date;

  // ============= FÖRSÄTTSSIDA =============
  let yPos = pageHeight / 2 - 60;

  // Titel
  doc.setFontSize(32);
  doc.setTextColor(...PRIMARY);
  doc.text("PROJEKTRAPPORT", pageWidth / 2, yPos, { align: "center" });
  yPos += 20;

  // Projektnamn
  doc.setFontSize(24);
  doc.setTextColor(...DARK);
  doc.text(data.project.name, pageWidth / 2, yPos, { align: "center" });
  yPos += 10;

  // Beställare
  if (data.project.client_name) {
    doc.setFontSize(14);
    doc.setTextColor(...MUTED);
    doc.text(`Beställare: ${data.project.client_name}`, pageWidth / 2, yPos, { align: "center" });
    yPos += 7;
  }

  // Adress
  if (data.project.address) {
    doc.setFontSize(11);
    doc.setTextColor(...MUTED);
    doc.text(data.project.address, pageWidth / 2, yPos, { align: "center" });
    yPos += 7;
  }

  // Divider
  yPos += 10;
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.8);
  doc.line(margin + 30, yPos, pageWidth - margin - 30, yPos);
  yPos += 20;

  // Statistik
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  
  if (firstDate && lastDate) {
    const periodText = `Period: ${format(new Date(firstDate), "d MMM yyyy", { locale: sv })} - ${format(new Date(lastDate), "d MMM yyyy", { locale: sv })}`;
    doc.text(periodText, pageWidth / 2, yPos, { align: "center" });
    yPos += 8;
  }

  doc.text(`Antal dagrapporter: ${data.reports.length}`, pageWidth / 2, yPos, { align: "center" });
  yPos += 8;
  doc.text(`Totalt arbetade timmar: ${totalHours.toFixed(1)}h`, pageWidth / 2, yPos, { align: "center" });
  yPos += 8;
  doc.text(`Antal avvikelser: ${totalDeviations}`, pageWidth / 2, yPos, { align: "center" });
  yPos += 8;
  if (totalAta > 0) {
    doc.text(`Rapporter med ÄTA: ${totalAta}`, pageWidth / 2, yPos, { align: "center" });
  }

  // ============= DAGRAPPORTER =============
  // Sortera i omvänd ordning (nyast först) för läsbarhet
  const reportsToRender = [...data.reports].sort(
    (a, b) => new Date(b.report_date).getTime() - new Date(a.report_date).getTime()
  );

  for (let i = 0; i < reportsToRender.length; i++) {
    const report = reportsToRender[i];
    
    // Ny sida för varje rapport
    doc.addPage();
    yPos = 20;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(...PRIMARY);
    doc.text(`DAGRAPPORT ${i + 1}`, margin, yPos);
    yPos += 8;

    // Datum
    doc.setFontSize(14);
    doc.setTextColor(...DARK);
    const dateStr = format(new Date(report.report_date), "d MMMM yyyy", { locale: sv });
    doc.text(dateStr, margin, yPos);
    yPos += 10;

    // Divider
    doc.setDrawColor(...PRIMARY);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Bemanning
    doc.setFontSize(12);
    doc.setTextColor(...DARK);
    doc.text("BEMANNING", margin, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      margin: { left: margin, right: margin },
      head: [],
      body: [
        ["Antal personer", report.headcount?.toString() || "—"],
        ["Timmar/person", report.hours_per_person ? `${report.hours_per_person}h` : "—"],
        ["Totala timmar", report.total_hours ? `${report.total_hours}h` : "—"],
        ["Roller", report.roles?.length ? report.roles.join(", ") : "—"],
      ],
      theme: "plain",
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: { textColor: MUTED, cellWidth: 45 },
        1: { textColor: DARK, fontStyle: "bold" },
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 8;

    // Utfört arbete
    if (report.work_items?.length) {
      doc.setFontSize(12);
      doc.setTextColor(...DARK);
      doc.text("UTFÖRT ARBETE", margin, yPos);
      yPos += 5;

      autoTable(doc, {
        startY: yPos,
        margin: { left: margin, right: margin },
        head: [],
        body: report.work_items.map((item) => [`• ${item}`]),
        theme: "plain",
        styles: { fontSize: 9, cellPadding: 2, textColor: DARK },
      });

      yPos = (doc as any).lastAutoTable.finalY + 8;
    }

    // Avvikelser
    if (report.deviations?.length) {
      doc.setFontSize(12);
      doc.setTextColor(...DARK);
      doc.text("AVVIKELSER", margin, yPos);
      yPos += 5;

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
          fillColor: PRIMARY,
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: "bold",
        },
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 30 },
          2: { cellWidth: 18, halign: "center" },
        },
      });

      yPos = (doc as any).lastAutoTable.finalY + 8;
    }

    // ÄTA
    if (report.ata?.has_ata && report.ata.items?.length) {
      doc.setFontSize(12);
      doc.setTextColor(...DARK);
      doc.text("ÄTA", margin, yPos);
      yPos += 5;

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
          fillColor: [59, 130, 246] as [number, number, number],
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: "bold",
        },
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: { 2: { cellWidth: 18, halign: "center" } },
      });

      yPos = (doc as any).lastAutoTable.finalY + 8;
    }

    // Material
    if (report.materials_delivered?.length || report.materials_missing?.length) {
      doc.setFontSize(12);
      doc.setTextColor(...DARK);
      doc.text("MATERIAL", margin, yPos);
      yPos += 5;

      const materialRows: string[][] = [];
      if (report.materials_delivered?.length) {
        materialRows.push(["Levererat", report.materials_delivered.join(", ")]);
      }
      if (report.materials_missing?.length) {
        materialRows.push(["Saknas", report.materials_missing.join(", ")]);
      }

      autoTable(doc, {
        startY: yPos,
        margin: { left: margin, right: margin },
        head: [],
        body: materialRows,
        theme: "plain",
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
          0: { textColor: MUTED, cellWidth: 25, fontStyle: "bold" },
          1: { textColor: DARK },
        },
      });

      yPos = (doc as any).lastAutoTable.finalY + 8;
    }

    // Anteckningar
    if (report.notes) {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.setTextColor(...DARK);
      doc.text("ANTECKNINGAR", margin, yPos);
      yPos += 5;

      doc.setFontSize(9);
      doc.setTextColor(...DARK);
      const splitNotes = doc.splitTextToSize(report.notes, pageWidth - margin * 2);
      doc.text(splitNotes, margin, yPos);
    }
  }

  // Sidfot på alla sidor
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
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

  // Filnamn
  const projectName = data.project.name
    .toLowerCase()
    .replace(/[^a-zåäö0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  const dateForFile = format(new Date(), "yyyy-MM-dd");
  const filename = `projektrapport_${projectName}_${dateForFile}.pdf`;

  doc.save(filename);
}
