import jsPDF from "jspdf";
import { format, parseISO } from "date-fns";
import { sv } from "date-fns/locale";

interface WorkOrderData {
  orderNumber: string;
  projectName: string;
  title: string;
  description: string;
  assignedTo: string;
  dueDate: string | null;
  status: string;
}

export async function generateWorkOrderPdf(data: WorkOrderData): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;

  // Colors
  const primaryColor: [number, number, number] = [30, 41, 59];
  const mutedColor: [number, number, number] = [100, 116, 139];

  // Header
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, pageWidth, 50, "F");

  doc.setFontSize(24);
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.text("ARBETSORDER", margin, 25);

  doc.setFontSize(14);
  doc.setTextColor(...mutedColor);
  doc.text(data.orderNumber, margin, 35);

  // Generated date
  doc.setFontSize(10);
  doc.text(`Skapad: ${format(new Date(), "d MMMM yyyy", { locale: sv })}`, pageWidth - margin, 25, { align: "right" });

  // Project info
  let y = 60;

  doc.setFontSize(12);
  doc.setTextColor(...mutedColor);
  doc.text("Projekt:", margin, y);
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.text(data.projectName, margin + 25, y);

  y += 15;

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(data.title, margin, y);

  y += 15;

  // Status badge
  doc.setFontSize(10);
  const statusText = data.status === "completed" ? "Klar" : data.status === "in_progress" ? "Pågående" : "Väntande";
  const statusColor: [number, number, number] = data.status === "completed" ? [34, 197, 94] : data.status === "in_progress" ? [59, 130, 246] : [148, 163, 184];
  
  doc.setFillColor(...statusColor);
  doc.roundedRect(margin, y - 4, 30, 8, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text(statusText, margin + 15, y + 1, { align: "center" });

  y += 20;

  // Assigned to
  if (data.assignedTo) {
    doc.setFontSize(11);
    doc.setTextColor(...mutedColor);
    doc.setFont("helvetica", "normal");
    doc.text("Tilldelad:", margin, y);
    doc.setTextColor(...primaryColor);
    doc.text(data.assignedTo, margin + 30, y);
    y += 10;
  }

  // Due date
  if (data.dueDate) {
    doc.setTextColor(...mutedColor);
    doc.text("Förfallodatum:", margin, y);
    doc.setTextColor(...primaryColor);
    doc.text(format(parseISO(data.dueDate), "d MMMM yyyy", { locale: sv }), margin + 40, y);
    y += 10;
  }

  y += 10;

  // Description section
  if (data.description) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryColor);
    doc.text("Beskrivning", margin, y);
    
    y += 8;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(data.description, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 6;
  }

  y += 30;

  // Signature section
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, margin + 80, y);
  doc.setFontSize(10);
  doc.setTextColor(...mutedColor);
  doc.text("Signatur", margin, y + 6);

  doc.line(pageWidth - margin - 80, y, pageWidth - margin, y);
  doc.text("Datum", pageWidth - margin - 80, y + 6);

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(8);
  doc.setTextColor(...mutedColor);
  doc.text(`Genererad ${format(new Date(), "yyyy-MM-dd HH:mm", { locale: sv })}`, margin, footerY);

  // Save
  const fileName = `Arbetsorder-${data.orderNumber}-${format(new Date(), "yyyyMMdd")}.pdf`;
  doc.save(fileName);
}
