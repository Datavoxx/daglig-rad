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

export interface KpiData {
  totalHours: number;
  uniqueWorkers: number;
  reportCount: number;
  marginPercent: number;
  ataCount: number;
  ataTotal: number;
  expensesTotal: number;
  quoteValue: number;
}

interface ProjectReport {
  project: Project;
  reports: DailyReport[];
  kpiData?: KpiData;
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

// KPI card colors (light backgrounds)
const KPI_COLORS = {
  teal:   { bg: [230, 248, 246], text: [13, 148, 136] },
  violet: { bg: [237, 233, 254], text: [109, 40, 217] },
  blue:   { bg: [224, 242, 254], text: [14, 116, 194] },
  green:  { bg: [220, 252, 231], text: [22, 163, 74] },
  amber:  { bg: [254, 243, 199], text: [180, 83, 9] },
  red:    { bg: [254, 226, 226], text: [220, 38, 38] },
} as const;

function safeFormatNumber(value: number): string {
  const isNegative = value < 0;
  const abs = Math.abs(value);
  const formatted = abs.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return isNegative ? `-${formatted}` : formatted;
}

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)} mkr`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(0)} tkr`;
  }
  return `${value.toFixed(0)} kr`;
}

function drawRoundedRect(
  doc: jsPDF,
  x: number, y: number, w: number, h: number,
  r: number,
  fillColor: number[]
) {
  doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
  doc.roundedRect(x, y, w, h, r, r, "F");
}

function renderKpiCard(
  doc: jsPDF,
  x: number, y: number, w: number, h: number,
  title: string, value: string, subtitle: string,
  colors: { bg: readonly number[]; text: readonly number[] }
) {
  drawRoundedRect(doc, x, y, w, h, 3, [...colors.bg]);

  // Title
  doc.setFontSize(9);
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  doc.text(title.toUpperCase(), x + w / 2, y + 10, { align: "center" });

  // Value
  doc.setFontSize(22);
  doc.setTextColor(...DARK);
  doc.text(value, x + w / 2, y + 24, { align: "center" });

  // Subtitle
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(subtitle, x + w / 2, y + 32, { align: "center" });
}

function renderKpiDashboardPage(doc: jsPDF, data: ProjectReport) {
  const kpi = data.kpiData!;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  doc.addPage();
  let yPos = 20;

  // Page title
  doc.setFontSize(20);
  doc.setTextColor(...PRIMARY);
  doc.text("PROJEKTDASHBOARD", margin, yPos);
  yPos += 4;

  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 12;

  // 3x2 KPI grid
  const gridWidth = pageWidth - margin * 2;
  const gap = 5;
  const cardW = (gridWidth - gap * 2) / 3;
  const cardH = 38;

  const hasQuote = kpi.quoteValue > 0;
  const marginColor = kpi.marginPercent >= 0 ? KPI_COLORS.green : KPI_COLORS.red;

  const kpiItems = [
    { title: "Totala timmar", value: `${kpi.totalHours.toFixed(1)}`, sub: "rapporterade timmar", colors: KPI_COLORS.teal },
    { title: "Medarbetare", value: `${kpi.uniqueWorkers}`, sub: "unika personer", colors: KPI_COLORS.violet },
    { title: "Dagrapporter", value: `${kpi.reportCount}`, sub: "rapporter", colors: KPI_COLORS.blue },
    { title: "Marginal", value: hasQuote ? `${kpi.marginPercent.toFixed(0)}%` : "—", sub: hasQuote ? "av projektvärde" : "Ingen offert kopplad", colors: hasQuote ? marginColor : KPI_COLORS.amber },
    { title: "ÄTA-arbeten", value: `${kpi.ataCount}`, sub: formatCurrency(kpi.ataTotal), colors: KPI_COLORS.amber },
    { title: "Utgifter", value: formatCurrency(kpi.expensesTotal), sub: "leverantörsfakturor", colors: KPI_COLORS.red },
  ];

  for (let i = 0; i < kpiItems.length; i++) {
    const row = Math.floor(i / 3);
    const col = i % 3;
    const x = margin + col * (cardW + gap);
    const y = yPos + row * (cardH + gap);
    const item = kpiItems[i];
    renderKpiCard(doc, x, y, cardW, cardH, item.title, item.value, item.sub, item.colors);
  }

  yPos += 2 * (cardH + gap) + 10;

  // Economic summary table
  doc.setFontSize(14);
  doc.setTextColor(...DARK);
  doc.text("Ekonomisk sammanfattning", margin, yPos);
  yPos += 6;

  const marginValue = kpi.quoteValue - kpi.expensesTotal;

  autoTable(doc, {
    startY: yPos,
    margin: { left: margin, right: margin },
    head: [["Post", "Belopp"]],
    body: [
      ["Offertvärde", hasQuote ? `${safeFormatNumber(kpi.quoteValue)} kr` : "Ingen offert kopplad"],
      ["Godkända ÄTA", `${safeFormatNumber(kpi.ataTotal)} kr`],
      ["Totala utgifter (leverantörer)", `${safeFormatNumber(kpi.expensesTotal)} kr`],
      ["Beräknad marginal", hasQuote ? `${safeFormatNumber(marginValue)} kr (${kpi.marginPercent.toFixed(0)}%)` : "Ej beräkningsbar"],
    ],
    theme: "striped",
    headStyles: {
      fillColor: PRIMARY,
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: "bold",
    },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { halign: "right", fontStyle: "bold" },
    },
    didParseCell: (hookData) => {
      // Color the margin row
      if (hookData.section === "body" && hookData.row.index === 3) {
        hookData.cell.styles.textColor = marginValue >= 0
          ? [...KPI_COLORS.green.text] as [number, number, number]
          : [...KPI_COLORS.red.text] as [number, number, number];
      }
    },
  });
}

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

  // ============= KPI DASHBOARD (sida 2) =============
  if (data.kpiData) {
    renderKpiDashboardPage(doc, data);
  }

  // ============= DAGRAPPORTER =============
  if (data.reports.length > 0) {
    const reportsToRender = [...data.reports].sort(
      (a, b) => new Date(b.report_date).getTime() - new Date(a.report_date).getTime()
    );

    for (let i = 0; i < reportsToRender.length; i++) {
      const report = reportsToRender[i];
      
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
