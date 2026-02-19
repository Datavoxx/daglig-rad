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

interface ProjectAtaItem {
  ata_number: string | null;
  description: string;
  article: string | null;
  quantity: number | null;
  unit: string | null;
  unit_price: number | null;
  subtotal: number | null;
  status: string | null;
}

interface ProjectWorkOrder {
  order_number: string | null;
  title: string;
  description: string | null;
  assigned_to: string | null;
  due_date: string | null;
  status: string | null;
}

interface ProjectPlan {
  phases: { name: string; weeks: number; description?: string }[];
  start_date: string | null;
  total_weeks: number | null;
}

interface ProjectFile {
  file_name: string;
  category: string | null;
  file_size: number | null;
  created_at: string | null;
}

interface ProjectReport {
  project: Project;
  reports: DailyReport[];
  kpiData?: KpiData;
  ataItems?: ProjectAtaItem[];
  workOrders?: ProjectWorkOrder[];
  plan?: ProjectPlan | null;
  projectFiles?: ProjectFile[];
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

// Colors — Byggio brand
const PRIMARY: [number, number, number] = [34, 197, 94];   // green-500 (Byggio)
const DARK: [number, number, number] = [15, 23, 42];       // slate-900
const MUTED: [number, number, number] = [100, 116, 139];   // slate-500

const KPI_COLORS = {
  green:  { bg: [220, 252, 231], text: [22, 163, 74] },
  violet: { bg: [237, 233, 254], text: [109, 40, 217] },
  blue:   { bg: [224, 242, 254], text: [14, 116, 194] },
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
  doc.setFontSize(9);
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  doc.text(title.toUpperCase(), x + w / 2, y + 10, { align: "center" });
  doc.setFontSize(22);
  doc.setTextColor(...DARK);
  doc.text(value, x + w / 2, y + 24, { align: "center" });
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(subtitle, x + w / 2, y + 32, { align: "center" });
}

// ---- Donut chart drawing ----
function drawDonutChart(
  doc: jsPDF,
  cx: number, cy: number, outerR: number, innerR: number,
  segments: { value: number; color: [number, number, number]; label: string }[]
) {
  const total = segments.reduce((s, seg) => s + Math.max(0, seg.value), 0);
  if (total <= 0) return;

  let startAngle = -Math.PI / 2; // start at top

  for (const seg of segments) {
    if (seg.value <= 0) continue;
    const sweep = (seg.value / total) * Math.PI * 2;
    drawArcSegment(doc, cx, cy, outerR, innerR, startAngle, startAngle + sweep, seg.color);
    startAngle += sweep;
  }

  // Inner circle (white hole)
  doc.setFillColor(255, 255, 255);
  doc.circle(cx, cy, innerR, "F");
}

function drawArcSegment(
  doc: jsPDF,
  cx: number, cy: number,
  outerR: number, innerR: number,
  startAngle: number, endAngle: number,
  color: [number, number, number]
) {
  const steps = 40;
  const points: [number, number][] = [];

  // Outer arc
  for (let i = 0; i <= steps; i++) {
    const a = startAngle + (endAngle - startAngle) * (i / steps);
    points.push([cx + Math.cos(a) * outerR, cy + Math.sin(a) * outerR]);
  }
  // Inner arc (reverse)
  for (let i = steps; i >= 0; i--) {
    const a = startAngle + (endAngle - startAngle) * (i / steps);
    points.push([cx + Math.cos(a) * innerR, cy + Math.sin(a) * innerR]);
  }

  doc.setFillColor(color[0], color[1], color[2]);

  // Draw filled polygon using lines
  if (points.length < 3) return;
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(0.1);

  // Use triangle fan approach for filling
  const firstPoint = points[0];
  for (let i = 1; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    doc.triangle(
      firstPoint[0], firstPoint[1],
      p1[0], p1[1],
      p2[0], p2[1],
      "F"
    );
  }
}

function renderDonutLegend(
  doc: jsPDF,
  x: number, y: number,
  segments: { value: number; color: [number, number, number]; label: string }[]
) {
  const total = segments.reduce((s, seg) => s + Math.max(0, seg.value), 0);
  let currentY = y;

  for (const seg of segments) {
    if (seg.value <= 0) continue;
    const pct = total > 0 ? ((seg.value / total) * 100).toFixed(0) : "0";

    doc.setFillColor(seg.color[0], seg.color[1], seg.color[2]);
    doc.circle(x + 3, currentY - 1.5, 2.5, "F");

    doc.setFontSize(9);
    doc.setTextColor(...DARK);
    doc.text(`${seg.label}: ${formatCurrency(seg.value)} (${pct}%)`, x + 9, currentY);
    currentY += 7;
  }
}

// ---- KPI Dashboard page ----
function renderKpiDashboardPage(doc: jsPDF, data: ProjectReport) {
  const kpi = data.kpiData!;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const hasQuote = kpi.quoteValue > 0;

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

  const marginColor = kpi.marginPercent >= 0 ? KPI_COLORS.green : KPI_COLORS.red;

  const kpiItems = [
    { title: "Totala timmar", value: `${kpi.totalHours.toFixed(1)}`, sub: "rapporterade timmar", colors: KPI_COLORS.green },
    { title: "Medarbetare", value: `${kpi.uniqueWorkers}`, sub: "unika personer", colors: KPI_COLORS.violet },
    { title: "Dagrapporter", value: `${kpi.reportCount}`, sub: "rapporter", colors: KPI_COLORS.blue },
    { title: "Marginal", value: hasQuote ? `${kpi.marginPercent.toFixed(0)}%` : "\u2014", sub: hasQuote ? "av projektvarde" : "Ingen offert kopplad", colors: hasQuote ? marginColor : KPI_COLORS.amber },
    { title: "ATA-arbeten", value: `${kpi.ataCount}`, sub: formatCurrency(kpi.ataTotal), colors: KPI_COLORS.amber },
    { title: "Utgifter", value: formatCurrency(kpi.expensesTotal), sub: "leverantorsfakturor", colors: KPI_COLORS.red },
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

  // ---- Donut chart (always show if there's any economic data) ----
  const hasEconomicData = kpi.expensesTotal > 0 || kpi.ataTotal > 0 || kpi.quoteValue > 0;
  if (hasEconomicData) {
    const marginValue = hasQuote ? Math.max(0, kpi.quoteValue - kpi.expensesTotal - kpi.ataTotal) : 0;
    const chartCx = pageWidth / 2 - 30;
    const chartCy = yPos + 28;

    doc.setFontSize(14);
    doc.setTextColor(...DARK);
    doc.text("Ekonomisk fördelning", margin, yPos);
    yPos += 6;

    const segments: { value: number; color: [number, number, number]; label: string }[] = [];
    if (marginValue > 0) segments.push({ value: marginValue, color: [34, 197, 94], label: "Marginal" });
    if (kpi.expensesTotal > 0) segments.push({ value: kpi.expensesTotal, color: [239, 68, 68], label: "Utgifter" });
    if (kpi.ataTotal > 0) segments.push({ value: kpi.ataTotal, color: [245, 158, 11], label: "ÄTA" });

    if (segments.length > 0) {
      drawDonutChart(doc, chartCx, chartCy, 22, 12, segments);

      // Center text
      const totalValue = hasQuote ? kpi.quoteValue : kpi.expensesTotal + kpi.ataTotal;
      doc.setFontSize(10);
      doc.setTextColor(...DARK);
      doc.text(formatCurrency(totalValue), chartCx, chartCy + 1, { align: "center" });
      doc.setFontSize(7);
      doc.setTextColor(...MUTED);
      doc.text(hasQuote ? "offertvärde" : "totalt", chartCx, chartCy + 5, { align: "center" });

      // Legend to the right
      renderDonutLegend(doc, chartCx + 32, chartCy - 8, segments);
    }

    yPos = chartCy + 35;
  }

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
      ["Offertvarde", hasQuote ? `${safeFormatNumber(kpi.quoteValue)} kr` : "Ingen offert kopplad"],
      ["Godkanda ATA", `${safeFormatNumber(kpi.ataTotal)} kr`],
      ["Totala utgifter (leverantorer)", `${safeFormatNumber(kpi.expensesTotal)} kr`],
      ["Beraknad marginal", hasQuote ? `${safeFormatNumber(marginValue)} kr (${kpi.marginPercent.toFixed(0)}%)` : "Ej berakningsbar"],
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
      if (hookData.section === "body" && hookData.row.index === 3) {
        hookData.cell.styles.textColor = marginValue >= 0
          ? [...KPI_COLORS.green.text] as [number, number, number]
          : [...KPI_COLORS.red.text] as [number, number, number];
      }
    },
  });
}

// ---- Cover page ----
function renderCoverPage(doc: jsPDF, data: ProjectReport) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // Use kpiData when available, fallback to report sums
  const kpi = data.kpiData;
  const totalHours = kpi ? kpi.totalHours : data.reports.reduce((sum, r) => sum + (r.total_hours || 0), 0);
  const totalDeviations = data.reports.reduce((sum, r) => sum + (r.deviations?.length || 0), 0);
  const totalAta = kpi ? kpi.ataCount : data.reports.filter(r => r.ata?.has_ata && r.ata.items?.length > 0).length;
  const uniqueWorkers = kpi ? kpi.uniqueWorkers : 0;

  const sortedReports = [...data.reports].sort(
    (a, b) => new Date(a.report_date).getTime() - new Date(b.report_date).getTime()
  );
  const firstDate = sortedReports[0]?.report_date;
  const lastDate = sortedReports[sortedReports.length - 1]?.report_date;

  let yPos = pageHeight / 2 - 70;

  // Title
  doc.setFontSize(32);
  doc.setTextColor(...PRIMARY);
  doc.text("PROJEKTRAPPORT", pageWidth / 2, yPos, { align: "center" });
  yPos += 20;

  // Project name
  doc.setFontSize(24);
  doc.setTextColor(...DARK);
  doc.text(data.project.name, pageWidth / 2, yPos, { align: "center" });
  yPos += 10;

  if (data.project.client_name) {
    doc.setFontSize(14);
    doc.setTextColor(...MUTED);
    doc.text(`Bestellare: ${data.project.client_name}`, pageWidth / 2, yPos, { align: "center" });
    yPos += 7;
  }

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

  // Stats block
  doc.setFontSize(11);
  doc.setTextColor(...DARK);

  if (firstDate && lastDate) {
    const periodText = `Period: ${format(new Date(firstDate), "d MMM yyyy", { locale: sv })} - ${format(new Date(lastDate), "d MMM yyyy", { locale: sv })}`;
    doc.text(periodText, pageWidth / 2, yPos, { align: "center" });
    yPos += 8;
  }

  doc.text(`Totalt arbetade timmar: ${totalHours.toFixed(1)} h`, pageWidth / 2, yPos, { align: "center" });
  yPos += 8;

  if (uniqueWorkers > 0) {
    doc.text(`Medarbetare: ${uniqueWorkers}`, pageWidth / 2, yPos, { align: "center" });
    yPos += 8;
  }

  doc.text(`Antal dagrapporter: ${data.reports.length}`, pageWidth / 2, yPos, { align: "center" });
  yPos += 8;

  doc.text(`Antal avvikelser: ${totalDeviations}`, pageWidth / 2, yPos, { align: "center" });
  yPos += 8;

  if (totalAta > 0) {
    doc.text(`ATA-arbeten: ${totalAta}`, pageWidth / 2, yPos, { align: "center" });
    yPos += 8;
  }

  // Economic mini-summary on cover
  if (kpi && kpi.quoteValue > 0) {
    yPos += 6;
    doc.setDrawColor(...MUTED);
    doc.setLineWidth(0.3);
    doc.line(margin + 50, yPos, pageWidth - margin - 50, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text(`Offertvarde: ${formatCurrency(kpi.quoteValue)}  |  Utgifter: ${formatCurrency(kpi.expensesTotal)}  |  Marginal: ${kpi.marginPercent.toFixed(0)}%`, pageWidth / 2, yPos, { align: "center" });
  }
}

// ---- Daily report pages ----
function renderDailyReportPages(doc: jsPDF, data: ProjectReport) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  if (data.reports.length === 0) return;

  const reportsToRender = [...data.reports].sort(
    (a, b) => new Date(b.report_date).getTime() - new Date(a.report_date).getTime()
  );

  for (let i = 0; i < reportsToRender.length; i++) {
    const report = reportsToRender[i];
    doc.addPage();
    let yPos = 20;

    doc.setFontSize(20);
    doc.setTextColor(...PRIMARY);
    doc.text(`DAGRAPPORT ${i + 1}`, margin, yPos);
    yPos += 8;

    doc.setFontSize(14);
    doc.setTextColor(...DARK);
    const dateStr = format(new Date(report.report_date), "d MMMM yyyy", { locale: sv });
    doc.text(dateStr, margin, yPos);
    yPos += 10;

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
        ["Antal personer", report.headcount?.toString() || "\u2014"],
        ["Timmar/person", report.hours_per_person ? `${report.hours_per_person}h` : "\u2014"],
        ["Totala timmar", report.total_hours ? `${report.total_hours}h` : "\u2014"],
        ["Roller", report.roles?.length ? report.roles.join(", ") : "\u2014"],
      ],
      theme: "plain",
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: { textColor: MUTED, cellWidth: 45 },
        1: { textColor: DARK, fontStyle: "bold" },
      },
    });
    yPos = (doc as any).lastAutoTable.finalY + 8;

    // Utfort arbete
    if (report.work_items?.length) {
      doc.setFontSize(12);
      doc.setTextColor(...DARK);
      doc.text("UTFORT ARBETE", margin, yPos);
      yPos += 5;

      autoTable(doc, {
        startY: yPos,
        margin: { left: margin, right: margin },
        head: [],
        body: report.work_items.map((item) => [`- ${item}`]),
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
          d.hours ? `${d.hours}h` : "\u2014",
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

    // ATA
    if (report.ata?.has_ata && report.ata.items?.length) {
      doc.setFontSize(12);
      doc.setTextColor(...DARK);
      doc.text("ATA", margin, yPos);
      yPos += 5;

      autoTable(doc, {
        startY: yPos,
        margin: { left: margin, right: margin },
        head: [["Anledning", "Konsekvens", "Timmar"]],
        body: report.ata.items.map((item) => [
          item.reason,
          item.consequence,
          item.estimated_hours ? `${item.estimated_hours}h` : "\u2014",
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

// ---- ÄTA page ----
function renderAtaPage(doc: jsPDF, items: ProjectAtaItem[]) {
  if (!items.length) return;
  const margin = 15;
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.addPage();
  let yPos = 20;

  doc.setFontSize(20);
  doc.setTextColor(...PRIMARY);
  doc.text("ÄTA-ARBETEN", margin, yPos);
  yPos += 4;
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  const statusLabels: Record<string, string> = {
    pending: "Väntande",
    approved: "Godkänd",
    rejected: "Avvisad",
    completed: "Klar",
  };

  autoTable(doc, {
    startY: yPos,
    margin: { left: margin, right: margin },
    head: [["Nr", "Beskrivning", "Antal", "Enhet", "À-pris", "Summa", "Status"]],
    body: items.map((a) => [
      a.ata_number || "—",
      a.description,
      a.quantity?.toString() || "—",
      a.unit || "st",
      a.unit_price ? `${safeFormatNumber(a.unit_price)} kr` : "—",
      a.subtotal ? `${safeFormatNumber(a.subtotal)} kr` : "—",
      statusLabels[a.status || ""] || a.status || "—",
    ]),
    theme: "striped",
    headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontSize: 9, fontStyle: "bold" },
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 55 },
      4: { halign: "right" },
      5: { halign: "right", fontStyle: "bold" },
    },
    didParseCell: (hookData) => {
      if (hookData.section === "body" && hookData.column.index === 6) {
        const val = hookData.cell.raw as string;
        if (val === "Godkänd" || val === "Klar") hookData.cell.styles.textColor = [...KPI_COLORS.green.text] as [number, number, number];
        else if (val === "Avvisad") hookData.cell.styles.textColor = [...KPI_COLORS.red.text] as [number, number, number];
        else hookData.cell.styles.textColor = [...KPI_COLORS.amber.text] as [number, number, number];
      }
    },
  });
}

// ---- Work Orders page ----
function renderWorkOrdersPage(doc: jsPDF, orders: ProjectWorkOrder[]) {
  if (!orders.length) return;
  const margin = 15;
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.addPage();
  let yPos = 20;

  doc.setFontSize(20);
  doc.setTextColor(...PRIMARY);
  doc.text("ARBETSORDER", margin, yPos);
  yPos += 4;
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  const statusLabels: Record<string, string> = {
    pending: "Väntande",
    in_progress: "Pågående",
    completed: "Klar",
  };

  autoTable(doc, {
    startY: yPos,
    margin: { left: margin, right: margin },
    head: [["Nr", "Titel", "Tilldelad", "Förfallodatum", "Status"]],
    body: orders.map((o) => [
      o.order_number || "—",
      o.title,
      o.assigned_to || "—",
      o.due_date ? format(new Date(o.due_date), "d MMM yyyy", { locale: sv }) : "—",
      statusLabels[o.status || ""] || o.status || "—",
    ]),
    theme: "striped",
    headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontSize: 9, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { cellWidth: 18 } },
    didParseCell: (hookData) => {
      if (hookData.section === "body" && hookData.column.index === 4) {
        const val = hookData.cell.raw as string;
        if (val === "Klar") hookData.cell.styles.textColor = [...KPI_COLORS.green.text] as [number, number, number];
        else if (val === "Pågående") hookData.cell.styles.textColor = [...KPI_COLORS.amber.text] as [number, number, number];
      }
    },
  });
}

// ---- Planning page ----
function renderPlanningPage(doc: jsPDF, plan: ProjectPlan) {
  if (!plan.phases?.length) return;
  const margin = 15;
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.addPage();
  let yPos = 20;

  doc.setFontSize(20);
  doc.setTextColor(...PRIMARY);
  doc.text("PLANERING", margin, yPos);
  yPos += 4;
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  if (plan.start_date) {
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text(`Startdatum: ${format(new Date(plan.start_date), "d MMM yyyy", { locale: sv })}  |  Totalt: ${plan.total_weeks || "—"} veckor`, margin, yPos);
    yPos += 8;
  }

  autoTable(doc, {
    startY: yPos,
    margin: { left: margin, right: margin },
    head: [["Fas", "Veckor", "Beskrivning"]],
    body: plan.phases.map((p: any) => [
      p.name || "—",
      p.weeks?.toString() || "—",
      p.description || "—",
    ]),
    theme: "striped",
    headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontSize: 9, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 1: { cellWidth: 20, halign: "center" } },
  });
}

// ---- Files page ----
function renderFilesPage(doc: jsPDF, files: ProjectFile[]) {
  if (!files.length) return;
  const margin = 15;
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.addPage();
  let yPos = 20;

  doc.setFontSize(20);
  doc.setTextColor(...PRIMARY);
  doc.text("PROJEKTFILER", margin, yPos);
  yPos += 4;
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  function formatFileSize(bytes: number | null): string {
    if (!bytes) return "—";
    if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
    if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`;
    return `${bytes} B`;
  }

  const categoryLabels: Record<string, string> = {
    document: "Dokument",
    image: "Bild",
    drawing: "Ritning",
    contract: "Avtal",
    other: "Övrigt",
  };

  autoTable(doc, {
    startY: yPos,
    margin: { left: margin, right: margin },
    head: [["Filnamn", "Kategori", "Storlek", "Uppladdad"]],
    body: files.map((f) => [
      f.file_name,
      categoryLabels[f.category || ""] || f.category || "—",
      formatFileSize(f.file_size),
      f.created_at ? format(new Date(f.created_at), "d MMM yyyy", { locale: sv }) : "—",
    ]),
    theme: "striped",
    headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontSize: 9, fontStyle: "bold" },
    styles: { fontSize: 8, cellPadding: 3 },
  });
}

// ---- Main export ----
export async function generateProjectPdf(data: ProjectReport): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // Page 1: Cover
  renderCoverPage(doc, data);

  // Page 2: KPI Dashboard
  if (data.kpiData) {
    renderKpiDashboardPage(doc, data);
  }

  // ÄTA
  if (data.ataItems?.length) {
    renderAtaPage(doc, data.ataItems);
  }

  // Work Orders
  if (data.workOrders?.length) {
    renderWorkOrdersPage(doc, data.workOrders);
  }

  // Planning
  if (data.plan) {
    renderPlanningPage(doc, data.plan);
  }

  // Daily reports
  renderDailyReportPages(doc, data);

  // Files
  if (data.projectFiles?.length) {
    renderFilesPage(doc, data.projectFiles);
  }

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(`Genererad ${format(new Date(), "yyyy-MM-dd HH:mm")}`, margin, pageHeight - 10);
    doc.text(`Sida ${i} av ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: "right" });
  }

  const projectName = data.project.name
    .toLowerCase()
    .replace(/[^a-z\u00e5\u00e4\u00f60-9]+/g, "_")
    .replace(/^_|_$/g, "");
  const dateForFile = format(new Date(), "yyyy-MM-dd");
  doc.save(`projektrapport_${projectName}_${dateForFile}.pdf`);
}
