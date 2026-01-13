import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, addDays } from "date-fns";

interface CompanyInfo {
  company_name?: string;
  org_number?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  bankgiro?: string;
  logo_url?: string;
}

interface CustomerInfo {
  name?: string;
  address?: string;
}

interface QuoteItem {
  moment: string;
  hours?: number;
  unit_price: number;
  subtotal: number;
}

interface QuoteData {
  // Company info
  company?: CompanyInfo;
  
  // Customer info (from project)
  customer?: CustomerInfo;
  
  // Quote metadata
  offerNumber: string;
  projectName: string;
  validDays?: number;
  version?: number;
  
  // Content
  scope: string;
  conditions: string[]; // Förutsättningar
  
  // Work items
  items: QuoteItem[];
  
  // Pricing
  laborCost: number;
  materialCost: number;
  subcontractorCost: number;
  markupPercent: number;
  
  // ROT
  rotEnabled: boolean;
  rotPercent: number;
  
  // Terms
  paymentTerms?: string;
}

// Colors matching JIA style
const PRIMARY: [number, number, number] = [13, 148, 136]; // teal-600
const DARK: [number, number, number] = [30, 41, 59]; // slate-800
const MUTED: [number, number, number] = [100, 116, 139]; // slate-500
const LIGHT_BG: [number, number, number] = [248, 250, 252]; // slate-50

export async function generateQuotePdf(data: QuoteData): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const validDays = data.validDays || 30;
  const today = new Date();
  const validUntil = addDays(today, validDays);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("sv-SE").format(Math.round(num));
  };

  // Calculate totals
  const subtotal = data.laborCost + data.materialCost + data.subcontractorCost;
  const markup = subtotal * (data.markupPercent / 100);
  const totalExclVat = subtotal + markup;
  const vat = totalExclVat * 0.25;
  const totalInclVat = totalExclVat + vat;
  
  // ROT calculation (only on labor)
  const rotAmount = data.rotEnabled ? data.laborCost * (data.rotPercent / 100) : 0;
  const amountToPay = totalInclVat - rotAmount;

  let yPos = margin;

  // ============================================
  // HEADER SECTION
  // ============================================
  
  // Logo (if available)
  let logoYOffset = 0;
  if (data.company?.logo_url) {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load logo"));
        img.src = data.company!.logo_url!;
      });
      
      // Calculate dimensions maintaining aspect ratio
      const maxWidth = 35;
      const maxHeight = 20;
      let imgWidth = img.width;
      let imgHeight = img.height;
      
      if (imgWidth > maxWidth) {
        imgHeight = (imgHeight * maxWidth) / imgWidth;
        imgWidth = maxWidth;
      }
      if (imgHeight > maxHeight) {
        imgWidth = (imgWidth * maxHeight) / imgHeight;
        imgHeight = maxHeight;
      }
      
      doc.addImage(img, 'PNG', margin, yPos - 3, imgWidth, imgHeight);
      logoYOffset = imgHeight + 3;
    } catch (e) {
      // If logo fails to load, continue without it
      console.warn("Could not load logo for PDF:", e);
    }
  }

  // Company info (left side)
  const companyStartY = yPos + logoYOffset;
  doc.setFontSize(14);
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "bold");
  doc.text(data.company?.company_name || "Ditt Företag AB", margin, companyStartY);
  
  let companyY = companyStartY + 5;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  
  if (data.company?.org_number) {
    doc.text(`Org.nr: ${data.company.org_number}`, margin, companyY);
    companyY += 4;
  }
  if (data.company?.address) {
    doc.text(data.company.address, margin, companyY);
    companyY += 4;
  }
  if (data.company?.postal_code && data.company?.city) {
    doc.text(`${data.company.postal_code} ${data.company.city}`, margin, companyY);
    companyY += 4;
  }
  if (data.company?.phone) {
    doc.text(`Tel: ${data.company.phone}`, margin, companyY);
    companyY += 4;
  }
  if (data.company?.email) {
    doc.text(data.company.email, margin, companyY);
  }

  // OFFERT title (right side)
  doc.setFontSize(28);
  doc.setTextColor(...PRIMARY);
  doc.setFont("helvetica", "bold");
  doc.text("OFFERT", pageWidth - margin, margin, { align: "right" });

  // Offer number and date (right side)
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK);
  doc.text(`Nr: ${data.offerNumber}`, pageWidth - margin, margin + 10, { align: "right" });
  doc.text(`Datum: ${format(today, "yyyy-MM-dd")}`, pageWidth - margin, margin + 15, { align: "right" });

  // Divider line
  yPos = 55;
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.8);
  doc.line(margin, yPos, pageWidth - margin, yPos);

  // ============================================
  // CUSTOMER & PROJECT INFO
  // ============================================
  yPos += 10;

  // Left column: Customer
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "bold");
  doc.text("KUND", margin, yPos);
  
  yPos += 5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK);
  doc.setFontSize(10);
  doc.text(data.customer?.name || "–", margin, yPos);
  
  if (data.customer?.address) {
    yPos += 5;
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(data.customer.address, margin, yPos);
  }

  // Right column: Project
  const rightColX = pageWidth / 2 + 10;
  let rightY = 65;
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "bold");
  doc.text("PROJEKT", rightColX, rightY);
  
  rightY += 5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK);
  doc.setFontSize(10);
  doc.text(data.projectName, rightColX, rightY);

  // Validity
  rightY += 8;
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(`Giltig t.o.m. ${format(validUntil, "yyyy-MM-dd")}`, rightColX, rightY);

  // ============================================
  // PROJECT DESCRIPTION (Scope)
  // ============================================
  yPos = 95;
  
  doc.setFillColor(...LIGHT_BG);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  
  doc.setFontSize(11);
  doc.setTextColor(...PRIMARY);
  doc.setFont("helvetica", "bold");
  doc.text("PROJEKTBESKRIVNING", margin, yPos);
  
  yPos += 6;
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "normal");
  
  const scopeLines = doc.splitTextToSize(data.scope || "Ej angiven", pageWidth - margin * 2);
  doc.text(scopeLines, margin, yPos);
  yPos += scopeLines.length * 5 + 8;

  // ============================================
  // CONDITIONS (Förutsättningar)
  // ============================================
  if (data.conditions && data.conditions.length > 0) {
    doc.setFontSize(11);
    doc.setTextColor(...PRIMARY);
    doc.setFont("helvetica", "bold");
    doc.text("FÖRUTSÄTTNINGAR", margin, yPos);
    
    yPos += 6;
    doc.setFontSize(9);
    doc.setTextColor(...DARK);
    doc.setFont("helvetica", "normal");
    
    data.conditions.forEach((condition) => {
      doc.text(`•  ${condition}`, margin, yPos);
      yPos += 5;
    });
    
    yPos += 5;
  }

  // ============================================
  // WORK TABLE (Arbete)
  // ============================================
  doc.setFontSize(11);
  doc.setTextColor(...PRIMARY);
  doc.setFont("helvetica", "bold");
  doc.text("ARBETE", margin, yPos);
  
  yPos += 4;

  // Filter to only labor items for detailed table
  const laborItems = data.items.filter(item => item.hours && item.hours > 0);
  
  if (laborItems.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [["Arbetsmoment", "Timmar", "À-pris", "Summa"]],
      body: laborItems.map((item) => [
        item.moment,
        item.hours?.toString() || "–",
        `${formatNumber(item.unit_price)} kr`,
        `${formatNumber(item.subtotal)} kr`,
      ]),
      theme: "plain",
      styles: {
        fontSize: 9,
        cellPadding: 3,
        textColor: DARK,
      },
      headStyles: {
        fillColor: LIGHT_BG,
        textColor: MUTED,
        fontStyle: "bold",
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { halign: "right", cellWidth: 22 },
        2: { halign: "right", cellWidth: 28 },
        3: { halign: "right", cellWidth: 28 },
      },
      margin: { left: margin, right: margin },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
  } else {
    yPos += 10;
  }

  // ============================================
  // PRICE SUMMARY
  // ============================================
  
  // Check if we need a new page
  if (yPos > pageHeight - 100) {
    doc.addPage();
    yPos = margin;
  }

  doc.setFontSize(11);
  doc.setTextColor(...PRIMARY);
  doc.setFont("helvetica", "bold");
  doc.text("PRISSAMMANSTÄLLNING", margin, yPos);
  
  yPos += 8;
  
  const priceBoxX = margin;
  const priceBoxWidth = pageWidth - margin * 2;
  const priceBoxHeight = data.rotEnabled ? 85 : 65;
  
  // Background box
  doc.setFillColor(...LIGHT_BG);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(priceBoxX, yPos, priceBoxWidth, priceBoxHeight, 3, 3, "FD");
  
  yPos += 10;
  const leftLabel = margin + 10;
  const rightValue = pageWidth - margin - 10;

  const addPriceLine = (label: string, value: string, isBold = false, isHighlight = false) => {
    doc.setFontSize(10);
    if (isHighlight) {
      doc.setFillColor(...PRIMARY);
      doc.roundedRect(leftLabel - 5, yPos - 4, priceBoxWidth - 10, 12, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
    } else if (isBold) {
      doc.setTextColor(...DARK);
      doc.setFont("helvetica", "bold");
    } else {
      doc.setTextColor(...MUTED);
      doc.setFont("helvetica", "normal");
    }
    doc.text(label, leftLabel, yPos);
    doc.text(value, rightValue, yPos, { align: "right" });
    yPos += 8;
  };

  addPriceLine("Arbetskostnad", `${formatNumber(data.laborCost)} kr`);
  addPriceLine("Materialkostnad", `${formatNumber(data.materialCost)} kr`);
  addPriceLine("Underentreprenörer", `${formatNumber(data.subcontractorCost)} kr`);
  
  yPos += 2;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(leftLabel, yPos, rightValue, yPos);
  yPos += 6;

  addPriceLine("Summa exkl. moms", `${formatNumber(totalExclVat)} kr`, true);
  addPriceLine("Moms 25%", `${formatNumber(vat)} kr`);
  
  yPos += 2;
  addPriceLine("Totalt inkl. moms", `${formatNumber(totalInclVat)} kr`, false, true);
  
  // ROT deduction
  if (data.rotEnabled) {
    yPos += 4;
    doc.setTextColor(34, 197, 94); // green
    doc.setFont("helvetica", "normal");
    doc.text(`ROT-avdrag (${data.rotPercent}% på arbetskostnad)`, leftLabel, yPos);
    doc.text(`-${formatNumber(rotAmount)} kr`, rightValue, yPos, { align: "right" });
    
    yPos += 10;
    doc.setFillColor(...DARK);
    doc.roundedRect(leftLabel - 5, yPos - 4, priceBoxWidth - 10, 14, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("ATT BETALA", leftLabel, yPos + 1);
    doc.text(`${formatNumber(amountToPay)} kr`, rightValue, yPos + 1, { align: "right" });
  }

  // ============================================
  // TERMS (Villkor)
  // ============================================
  yPos += 20;
  
  // Check if we need a new page
  if (yPos > pageHeight - 50) {
    doc.addPage();
    yPos = margin;
  }

  doc.setFontSize(11);
  doc.setTextColor(...PRIMARY);
  doc.setFont("helvetica", "bold");
  doc.text("VILLKOR", margin, yPos);
  
  yPos += 6;
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "normal");
  
  const terms = [
    `Offerten är giltig i ${validDays} dagar från offertdatum.`,
    `Betalningsvillkor: ${data.paymentTerms || "30 dagar netto"}`,
  ];
  
  if (data.company?.bankgiro) {
    terms.push(`Bankgiro: ${data.company.bankgiro}`);
  }
  
  if (data.rotEnabled) {
    terms.push(`ROT-avdrag: Kunden ansvarar för att uppfylla kraven för ROT-avdrag.`);
  }

  terms.forEach((term) => {
    doc.text(`•  ${term}`, margin, yPos);
    yPos += 5;
  });

  // ============================================
  // FOOTER
  // ============================================
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "normal");
  
  // Page number
  doc.text(
    "Sida 1 av 1",
    pageWidth - margin,
    pageHeight - 10,
    { align: "right" }
  );
  
  // Company footer line
  const footerParts = [];
  if (data.company?.company_name) footerParts.push(data.company.company_name);
  if (data.company?.phone) footerParts.push(`Tel: ${data.company.phone}`);
  if (data.company?.email) footerParts.push(data.company.email);
  
  if (footerParts.length > 0) {
    doc.text(footerParts.join("  •  "), margin, pageHeight - 10);
  }

  // ============================================
  // SAVE FILE
  // ============================================
  const projectName = data.projectName
    .toLowerCase()
    .replace(/[^a-zåäö0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  const dateForFile = format(new Date(), "yyyy-MM-dd");
  const filename = `offert_${data.offerNumber.replace(/[^a-zA-Z0-9]/g, "_")}_${projectName}_${dateForFile}.pdf`;

  doc.save(filename);
}
