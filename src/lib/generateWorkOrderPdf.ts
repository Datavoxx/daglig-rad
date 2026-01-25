import jsPDF from "jspdf";
import { format, parseISO } from "date-fns";
import { sv } from "date-fns/locale";

interface EstimateItem {
  quantity: number | null;
  unit: string | null;
  article: string | null;
  moment: string;
}

interface WorkOrderData {
  orderNumber: string;
  projectName: string;
  title: string;
  description: string;
  assignedTo: string;
  dueDate: string | null;
  status: string;
  // Extended project data
  clientName?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  startDate?: string;
  contactEmail?: string;
  // Estimate items
  estimateItems?: EstimateItem[];
}

export async function generateWorkOrderPdf(data: WorkOrderData): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;

  // Colors
  const primaryColor: [number, number, number] = [30, 41, 59];
  const mutedColor: [number, number, number] = [100, 116, 139];
  const lightGray: [number, number, number] = [241, 245, 249];

  // Header background
  doc.setFillColor(...lightGray);
  doc.rect(0, 0, pageWidth, 45, "F");

  // Header title
  doc.setFontSize(22);
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.text("ARBETSORDER", margin, 22);

  // Order number
  doc.setFontSize(14);
  doc.setTextColor(...mutedColor);
  doc.setFont("helvetica", "normal");
  doc.text(data.orderNumber, margin, 32);

  // Page info (right side)
  doc.setFontSize(10);
  doc.text(`Sida 1 (1)`, pageWidth - margin, 22, { align: "right" });
  doc.text(format(new Date(), "yyyy-MM-dd", { locale: sv }), pageWidth - margin, 30, { align: "right" });

  // Info section - two columns
  let y = 55;
  const colWidth = contentWidth / 2;
  const leftCol = margin;
  const rightCol = margin + colWidth;

  // Draw info box
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.rect(margin, y - 5, contentWidth, 40, "S");

  // Left column info
  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);
  doc.setFont("helvetica", "normal");
  
  doc.text("Projektnr:", leftCol + 3, y + 3);
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.text(data.orderNumber, leftCol + 25, y + 3);

  doc.setTextColor(...mutedColor);
  doc.setFont("helvetica", "normal");
  doc.text("Ansvarig:", leftCol + 3, y + 12);
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.text(data.assignedTo || "-", leftCol + 25, y + 12);

  doc.setTextColor(...mutedColor);
  doc.setFont("helvetica", "normal");
  doc.text("Startdatum:", leftCol + 3, y + 21);
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.text(data.startDate ? format(parseISO(data.startDate), "yyyy-MM-dd", { locale: sv }) : "-", leftCol + 25, y + 21);

  if (data.dueDate) {
    doc.setTextColor(...mutedColor);
    doc.setFont("helvetica", "normal");
    doc.text("Förfaller:", leftCol + 3, y + 30);
    doc.setTextColor(...primaryColor);
    doc.setFont("helvetica", "bold");
    doc.text(format(parseISO(data.dueDate), "yyyy-MM-dd", { locale: sv }), leftCol + 25, y + 30);
  }

  // Right column info
  doc.setTextColor(...mutedColor);
  doc.setFont("helvetica", "normal");
  doc.text("Kund:", rightCol + 3, y + 3);
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.text(data.clientName || "-", rightCol + 25, y + 3);

  doc.setTextColor(...mutedColor);
  doc.setFont("helvetica", "normal");
  doc.text("Arbetsplats:", rightCol + 3, y + 12);
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  const fullAddress = [data.address, data.postalCode, data.city].filter(Boolean).join(", ");
  const addressLines = doc.splitTextToSize(fullAddress || "-", colWidth - 30);
  doc.text(addressLines, rightCol + 25, y + 12);

  if (data.contactEmail) {
    doc.setTextColor(...mutedColor);
    doc.setFont("helvetica", "normal");
    doc.text("Kontakt:", rightCol + 3, y + 21);
    doc.setTextColor(...primaryColor);
    doc.setFont("helvetica", "bold");
    doc.text(data.contactEmail, rightCol + 25, y + 21);
  }

  y += 50;

  // Project title section
  doc.setFillColor(...lightGray);
  doc.rect(margin, y, contentWidth, 12, "F");
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.text(`Projekt: ${data.projectName}`, margin + 4, y + 8);

  y += 20;

  // Work order title and description
  if (data.title) {
    doc.setFontSize(11);
    doc.setTextColor(...primaryColor);
    doc.setFont("helvetica", "bold");
    doc.text("Arbetsuppgift:", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    const titleLines = doc.splitTextToSize(data.title, contentWidth);
    doc.text(titleLines, margin, y);
    y += titleLines.length * 5 + 5;
  }

  if (data.description) {
    doc.setFontSize(10);
    doc.setTextColor(...mutedColor);
    doc.setFont("helvetica", "bold");
    doc.text("Arbetsbeskrivning:", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...primaryColor);
    const descLines = doc.splitTextToSize(data.description, contentWidth);
    doc.text(descLines, margin, y);
    y += descLines.length * 5 + 10;
  }

  // Estimate items section
  if (data.estimateItems && data.estimateItems.length > 0) {
    doc.setFillColor(...lightGray);
    doc.rect(margin, y, contentWidth, 10, "F");
    doc.setFontSize(11);
    doc.setTextColor(...primaryColor);
    doc.setFont("helvetica", "bold");
    doc.text("Information från offert:", margin + 4, y + 7);
    y += 15;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    
    for (const item of data.estimateItems) {
      if (y > pageHeight - 50) {
        // Avoid overflow - in a more complex version we'd add new pages
        break;
      }
      
      const qty = item.quantity != null ? `${item.quantity}` : "-";
      const unit = item.unit || "st";
      const article = item.article || "";
      const moment = item.moment || "";
      
      doc.setTextColor(...mutedColor);
      doc.text(`${qty} ${unit}`, margin, y);
      doc.setTextColor(...primaryColor);
      const itemText = article ? `${article} – ${moment}` : moment;
      const itemLines = doc.splitTextToSize(itemText, contentWidth - 25);
      doc.text(itemLines, margin + 25, y);
      y += itemLines.length * 5 + 3;
    }
    y += 10;
  }

  // Signature section at bottom
  const signatureY = Math.max(y + 20, pageHeight - 50);
  
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.5);
  doc.line(margin, signatureY, margin + 70, signatureY);
  doc.line(pageWidth - margin - 50, signatureY, pageWidth - margin, signatureY);

  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);
  doc.setFont("helvetica", "normal");
  doc.text("Signatur", margin, signatureY + 5);
  doc.text("Datum", pageWidth - margin - 50, signatureY + 5);

  // Footer
  const footerY = pageHeight - 10;
  doc.setFontSize(8);
  doc.setTextColor(...mutedColor);
  doc.text(`Genererad ${format(new Date(), "yyyy-MM-dd HH:mm", { locale: sv })}`, margin, footerY);

  // Status badge (top right of content)
  const statusText = data.status === "completed" ? "Klar" : data.status === "in_progress" ? "Pågående" : "Väntande";
  const statusColor: [number, number, number] = data.status === "completed" ? [34, 197, 94] : data.status === "in_progress" ? [59, 130, 246] : [148, 163, 184];
  
  doc.setFillColor(...statusColor);
  doc.roundedRect(pageWidth - margin - 25, 50, 25, 7, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(statusText, pageWidth - margin - 12.5, 55, { align: "center" });

  // Save
  const fileName = `Arbetsorder-${data.orderNumber}-${format(new Date(), "yyyyMMdd")}.pdf`;
  doc.save(fileName);
}
