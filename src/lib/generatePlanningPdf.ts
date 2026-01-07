import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface PlanPhase {
  name: string;
  start_week: number;
  duration_weeks: number;
  color: string;
  parallel_with?: string | null;
}

interface PlanningData {
  projectName: string;
  phases: PlanPhase[];
  totalWeeks: number;
  summary?: string;
}

// Colors
const PRIMARY: [number, number, number] = [13, 148, 136]; // teal-600
const DARK: [number, number, number] = [30, 41, 59]; // slate-800
const MUTED: [number, number, number] = [100, 116, 139]; // slate-500
const WHITE: [number, number, number] = [255, 255, 255];

// Phase colors for Gantt bars
const phaseColors: Record<string, [number, number, number]> = {
  slate: [100, 116, 139],    // slate-500
  blue: [59, 130, 246],      // blue-500
  emerald: [16, 185, 129],   // emerald-500
  amber: [245, 158, 11],     // amber-500
  purple: [139, 92, 246],    // purple-500
  rose: [244, 63, 94],       // rose-500
  cyan: [6, 182, 212],       // cyan-500
  orange: [249, 115, 22],    // orange-500
};

const phaseColorsLight: Record<string, [number, number, number]> = {
  slate: [203, 213, 225],    // slate-300
  blue: [147, 197, 253],     // blue-300
  emerald: [110, 231, 183],  // emerald-300
  amber: [252, 211, 77],     // amber-300
  purple: [196, 181, 253],   // purple-300
  rose: [253, 164, 175],     // rose-300
  cyan: [103, 232, 249],     // cyan-300
  orange: [253, 186, 116],   // orange-300
};

export async function generatePlanningPdf(data: PlanningData): Promise<void> {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // === PAGE 1: Cover Page ===
  
  // Background accent
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pageWidth, 8, "F");
  
  // Title
  let yPos = 60;
  doc.setFontSize(36);
  doc.setTextColor(...PRIMARY);
  doc.text("PROJEKTPLANERING", pageWidth / 2, yPos, { align: "center" });
  
  // Divider
  yPos += 12;
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.8);
  doc.line(pageWidth / 2 - 40, yPos, pageWidth / 2 + 40, yPos);
  
  // Project name
  yPos += 20;
  doc.setFontSize(24);
  doc.setTextColor(...DARK);
  doc.text(data.projectName, pageWidth / 2, yPos, { align: "center" });
  
  // Summary stats
  yPos += 25;
  doc.setFontSize(14);
  doc.setTextColor(...MUTED);
  doc.text(`Total projekttid: ca ${data.totalWeeks} veckor`, pageWidth / 2, yPos, { align: "center" });
  yPos += 8;
  doc.text(`Antal moment: ${data.phases.length}`, pageWidth / 2, yPos, { align: "center" });
  
  // Summary text if available
  if (data.summary) {
    yPos += 15;
    doc.setFontSize(11);
    doc.setTextColor(...DARK);
    const splitSummary = doc.splitTextToSize(data.summary, pageWidth - margin * 4);
    doc.text(splitSummary, pageWidth / 2, yPos, { align: "center" });
  }
  
  // Footer on cover
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(
    `Genererad ${format(new Date(), "d MMMM yyyy", { locale: sv })}`,
    pageWidth / 2,
    pageHeight - 20,
    { align: "center" }
  );

  // === PAGE 2: Gantt Timeline ===
  doc.addPage();
  
  // Header
  yPos = 20;
  doc.setFontSize(18);
  doc.setTextColor(...PRIMARY);
  doc.text("TIDSLINJE", margin, yPos);
  
  // Subtitle
  yPos += 8;
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(`${data.projectName} • ${data.totalWeeks} veckor`, margin, yPos);
  
  yPos += 15;
  
  // Gantt chart dimensions
  const ganttLeft = margin + 55; // Space for phase names
  const ganttWidth = pageWidth - ganttLeft - margin;
  const weekWidth = ganttWidth / Math.max(data.totalWeeks, 1);
  const rowHeight = 12;
  const headerHeight = 10;
  
  // Week headers
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  for (let week = 1; week <= data.totalWeeks; week++) {
    const xPos = ganttLeft + (week - 1) * weekWidth;
    doc.text(`V${week}`, xPos + weekWidth / 2, yPos, { align: "center" });
  }
  
  yPos += headerHeight;
  
  // Horizontal line under headers
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.3);
  doc.line(ganttLeft, yPos, ganttLeft + ganttWidth, yPos);
  
  yPos += 4;
  
  // Draw vertical grid lines
  doc.setDrawColor(241, 245, 249); // slate-100
  doc.setLineWidth(0.2);
  for (let week = 0; week <= data.totalWeeks; week++) {
    const xPos = ganttLeft + week * weekWidth;
    doc.line(xPos, yPos, xPos, yPos + data.phases.length * rowHeight);
  }
  
  // Draw phases
  data.phases.forEach((phase, index) => {
    const rowY = yPos + index * rowHeight;
    
    // Phase name
    doc.setFontSize(9);
    doc.setTextColor(...DARK);
    const truncatedName = phase.name.length > 20 ? phase.name.substring(0, 18) + "..." : phase.name;
    doc.text(truncatedName, margin, rowY + rowHeight / 2 + 1);
    
    // Calculate bar position
    const barX = ganttLeft + (phase.start_week - 1) * weekWidth + 1;
    const barWidth = phase.duration_weeks * weekWidth - 2;
    const barY = rowY + 1;
    const barHeight = rowHeight - 3;
    
    // Draw bar background (light color)
    const lightColor = phaseColorsLight[phase.color] || phaseColorsLight.slate;
    doc.setFillColor(...lightColor);
    doc.roundedRect(barX, barY, barWidth, barHeight, 2, 2, "F");
    
    // Draw bar border
    const borderColor = phaseColors[phase.color] || phaseColors.slate;
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.5);
    doc.roundedRect(barX, barY, barWidth, barHeight, 2, 2, "S");
    
    // Duration text inside bar
    if (barWidth > 12) {
      doc.setFontSize(7);
      doc.setTextColor(...DARK);
      const durationText = `${phase.duration_weeks}v`;
      doc.text(durationText, barX + barWidth / 2, barY + barHeight / 2 + 1.5, { align: "center" });
    }
    
    // Horizontal separator
    if (index < data.phases.length - 1) {
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.1);
      doc.line(margin, rowY + rowHeight, ganttLeft + ganttWidth, rowY + rowHeight);
    }
  });
  
  // === Phase Table ===
  const tableStartY = yPos + data.phases.length * rowHeight + 20;
  
  // Check if we need a new page for the table
  if (tableStartY > pageHeight - 60) {
    doc.addPage();
    yPos = 20;
  } else {
    yPos = tableStartY;
  }
  
  doc.setFontSize(14);
  doc.setTextColor(...PRIMARY);
  doc.text("MOMENTLISTA", margin, yPos);
  yPos += 8;
  
  autoTable(doc, {
    startY: yPos,
    margin: { left: margin, right: margin },
    head: [["Moment", "Startvecka", "Längd", "Parallellt med"]],
    body: data.phases.map((phase) => [
      phase.name,
      `V${phase.start_week}`,
      phase.duration_weeks === 1 ? "1 vecka" : `${phase.duration_weeks} veckor`,
      phase.parallel_with || "—",
    ]),
    theme: "striped",
    headStyles: {
      fillColor: PRIMARY,
      textColor: WHITE,
      fontSize: 9,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 30, halign: "center" },
      2: { cellWidth: 30, halign: "center" },
      3: { cellWidth: 50 },
    },
  });
  
  // === Color Legend ===
  const legendY = (doc as any).lastAutoTable.finalY + 15;
  
  // Check if we need a new page for legend
  if (legendY > pageHeight - 30) {
    doc.addPage();
  }
  
  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    
    // Timestamp on left
    doc.text(
      `Genererad ${format(new Date(), "yyyy-MM-dd HH:mm")}`,
      margin,
      pageHeight - 10
    );
    
    // Page number on right
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
  const filename = `planering_${projectName}_${dateForFile}.pdf`;
  
  doc.save(filename);
}
