import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { getCompanyLogoBase64, PDF_COLORS } from "./pdfUtils";

interface AtaItem {
  id: string;
  ata_number: string | null;
  article: string | null;
  description: string;
  unit: string | null;
  quantity: number | null;
  unit_price: number | null;
  subtotal: number | null;
  rot_eligible: boolean | null;
  status: string;
}

interface ProjectInfo {
  name: string;
  client_name: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
}

interface CompanySettings {
  company_name: string | null;
  org_number: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
}

interface GenerateAtaPdfParams {
  ataItems: AtaItem[];
  project: ProjectInfo;
  companySettings: CompanySettings | null;
}

export async function generateAtaPdf({
  ataItems,
  project,
  companySettings,
}: GenerateAtaPdfParams): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;

  // Get logo
  const logoBase64 = await getCompanyLogoBase64(companySettings?.logo_url || null);

  let yPos = margin;

  // === HEADER ===
  
  // Logo (left side)
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "AUTO", margin, yPos, 35, 18, undefined, "FAST");
    } catch (e) {
      console.error("Error adding logo:", e);
    }
  }

  // Company info (right side)
  if (companySettings?.company_name) {
    doc.setFontSize(10);
    doc.setTextColor(...PDF_COLORS.DARK);
    doc.setFont("helvetica", "bold");
    doc.text(companySettings.company_name, pageWidth - margin, yPos + 4, { align: "right" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...PDF_COLORS.MUTED);
    
    let rightY = yPos + 9;
    if (companySettings.address) {
      doc.text(companySettings.address, pageWidth - margin, rightY, { align: "right" });
      rightY += 4;
    }
    if (companySettings.postal_code || companySettings.city) {
      doc.text(
        `${companySettings.postal_code || ""} ${companySettings.city || ""}`.trim(),
        pageWidth - margin,
        rightY,
        { align: "right" }
      );
      rightY += 4;
    }
    if (companySettings.phone) {
      doc.text(companySettings.phone, pageWidth - margin, rightY, { align: "right" });
    }
  }

  yPos += 30;

  // Title
  doc.setFontSize(22);
  doc.setTextColor(...PDF_COLORS.DARK);
  doc.setFont("helvetica", "bold");
  doc.text("ÄNDRINGS- OCH TILLÄGGSARBETEN", margin, yPos);
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setTextColor(...PDF_COLORS.MUTED);
  doc.setFont("helvetica", "normal");
  doc.text(`Datum: ${format(new Date(), "yyyy-MM-dd")}`, margin, yPos);

  yPos += 12;

  // Divider
  doc.setDrawColor(...PDF_COLORS.MUTED);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);

  yPos += 10;

  // === PROJECT INFO ===
  doc.setFillColor(...PDF_COLORS.LIGHT_GRAY);
  doc.rect(margin, yPos, contentWidth, 25, "F");

  doc.setFontSize(11);
  doc.setTextColor(...PDF_COLORS.DARK);
  doc.setFont("helvetica", "bold");
  doc.text("Projektinformation", margin + 4, yPos + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  
  let infoY = yPos + 12;
  doc.setTextColor(...PDF_COLORS.MUTED);
  doc.text("Projekt:", margin + 4, infoY);
  doc.setTextColor(...PDF_COLORS.DARK);
  doc.text(project.name, margin + 30, infoY);

  if (project.client_name) {
    infoY += 5;
    doc.setTextColor(...PDF_COLORS.MUTED);
    doc.text("Kund:", margin + 4, infoY);
    doc.setTextColor(...PDF_COLORS.DARK);
    doc.text(project.client_name, margin + 30, infoY);
  }

  // Address on right side
  if (project.address) {
    doc.setTextColor(...PDF_COLORS.MUTED);
    doc.text("Arbetsplats:", margin + 80, yPos + 12);
    doc.setTextColor(...PDF_COLORS.DARK);
    const fullAddress = [project.address, `${project.postal_code || ""} ${project.city || ""}`]
      .filter(Boolean)
      .join(", ");
    doc.text(fullAddress, margin + 105, yPos + 12);
  }

  yPos += 32;

  // === ÄTA TABLE ===
  const approvedItems = ataItems.filter((item) => item.status === "approved");
  const pendingItems = ataItems.filter((item) => item.status === "pending");

  // Calculate totals
  const approvedTotal = approvedItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  const pendingTotal = pendingItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  const grandTotal = approvedTotal + pendingTotal;

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("sv-SE", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + " kr";
  };

  // Table
  autoTable(doc, {
    startY: yPos,
    margin: { left: margin, right: margin },
    head: [["ÄTA-nr", "Artikel", "Beskrivning", "Antal", "Enhet", "À-pris", "Summa", "Status"]],
    body: ataItems.map((item) => [
      item.ata_number || "-",
      item.article || "-",
      item.description,
      item.quantity?.toString() || "-",
      item.unit || "st",
      item.unit_price ? formatCurrency(item.unit_price) : "-",
      item.subtotal ? formatCurrency(item.subtotal) : "-",
      item.status === "approved" ? "Godkänd" : item.status === "rejected" ? "Nekad" : "Väntande",
    ]),
    theme: "striped",
    headStyles: {
      fillColor: PDF_COLORS.HEADER_BG,
      textColor: PDF_COLORS.WHITE,
      fontSize: 8,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 18 },
      2: { cellWidth: 50 },
      3: { cellWidth: 14, halign: "right" },
      4: { cellWidth: 14 },
      5: { cellWidth: 20, halign: "right" },
      6: { cellWidth: 22, halign: "right" },
      7: { cellWidth: 18 },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 8;

  // === TOTALS ===
  doc.setFillColor(...PDF_COLORS.LIGHT_GRAY);
  doc.rect(pageWidth - margin - 70, yPos, 70, 28, "F");

  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.MUTED);
  doc.text("Godkänd summa:", pageWidth - margin - 66, yPos + 7);
  doc.text("Väntande summa:", pageWidth - margin - 66, yPos + 14);
  
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PDF_COLORS.DARK);
  doc.text("TOTALT:", pageWidth - margin - 66, yPos + 23);

  doc.setFont("helvetica", "normal");
  doc.text(formatCurrency(approvedTotal), pageWidth - margin - 4, yPos + 7, { align: "right" });
  doc.text(formatCurrency(pendingTotal), pageWidth - margin - 4, yPos + 14, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(grandTotal), pageWidth - margin - 4, yPos + 23, { align: "right" });

  yPos += 40;

  // === APPROVAL SECTION ===
  // Check if we need a new page
  if (yPos > pageHeight - 80) {
    doc.addPage();
    yPos = margin;
  }

  doc.setDrawColor(...PDF_COLORS.MUTED);
  doc.setLineWidth(0.3);
  doc.rect(margin, yPos, contentWidth, 55, "S");

  doc.setFillColor(...PDF_COLORS.HEADER_BG);
  doc.rect(margin, yPos, contentWidth, 10, "F");

  doc.setFontSize(11);
  doc.setTextColor(...PDF_COLORS.WHITE);
  doc.setFont("helvetica", "bold");
  doc.text("GODKÄNNANDE", margin + 4, yPos + 7);

  yPos += 16;
  doc.setTextColor(...PDF_COLORS.DARK);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Genom undertecknande godkänns ovanstående ändrings- och tilläggsarbeten.",
    margin + 4,
    yPos
  );

  yPos += 12;

  // Signature lines
  const signatureWidth = (contentWidth - 20) / 2;
  
  // Left signature (Customer)
  doc.setDrawColor(...PDF_COLORS.MUTED);
  doc.setLineWidth(0.2);
  doc.line(margin + 4, yPos + 15, margin + 4 + signatureWidth, yPos + 15);
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.MUTED);
  doc.text("Beställare (signatur)", margin + 4, yPos + 20);
  doc.text("Datum: ________________", margin + 4, yPos + 26);

  // Right signature (Contractor)
  doc.line(margin + 14 + signatureWidth, yPos + 15, margin + 14 + 2 * signatureWidth, yPos + 15);
  doc.text("Entreprenör (signatur)", margin + 14 + signatureWidth, yPos + 20);
  doc.text("Datum: ________________", margin + 14 + signatureWidth, yPos + 26);

  // === FOOTER ===
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.MUTED);
  doc.text(
    `Genererad ${format(new Date(), "yyyy-MM-dd HH:mm", { locale: sv })}`,
    margin,
    pageHeight - 10
  );
  doc.text("Sida 1 av 1", pageWidth - margin, pageHeight - 10, { align: "right" });

  // Save
  const projectName = project.name
    .toLowerCase()
    .replace(/[^a-zåäö0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  const fileName = `ata_${projectName}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(fileName);
}
