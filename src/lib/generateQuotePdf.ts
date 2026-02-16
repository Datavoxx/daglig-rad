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
  contact_person?: string;
  contact_phone?: string;
  momsregnr?: string;
  f_skatt?: boolean;
}

interface CustomerInfo {
  name?: string;
  address?: string;
}

interface QuoteItem {
  moment: string;
  description?: string;
  article?: string;
  show_only_total?: boolean;
  type?: "labor" | "material" | "subcontractor";
  quantity?: number;
  unit?: string;
  hours?: number;
  unit_price: number;
  subtotal: number;
  rot_eligible?: boolean;
  rut_eligible?: boolean;
}

interface QuoteData {
  company?: CompanyInfo;
  customer?: CustomerInfo;
  offerNumber: string;
  projectName: string;
  validDays?: number;
  version?: number;
  scope: string;
  conditions: string[];
  items: QuoteItem[];
  laborCost: number;
  materialCost: number;
  subcontractorCost: number;
  markupPercent: number;
  rotEnabled: boolean;
  rotPercent: number;
  rutEnabled?: boolean;
  paymentTerms?: string;
}

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

  // Tax deduction limits (2026)
  const ROT_MAX = 50000;
  const RUT_MAX = 75000;
  const COMBINED_MAX = 75000;

  // Calculate totals
  const subtotal = data.laborCost + data.materialCost + data.subcontractorCost;
  
  // Per-item markup
  const markupFromItems = data.items.reduce((sum, item) => {
    if ((item as any).markup_enabled && (item as any).markup_percent > 0) {
      return sum + (item.subtotal || 0) * ((item as any).markup_percent / 100);
    }
    return sum;
  }, 0);
  const markup = markupFromItems > 0 ? markupFromItems : subtotal * (data.markupPercent / 100);
  const totalExclVat = subtotal + markup;
  const vat = totalExclVat * 0.25;
  const totalInclVat = totalExclVat + vat;
  
  // ROT calculation - use rot_eligible items only
  const rotEligibleLaborCost = data.items
    .filter((item) => item.type === "labor" && item.rot_eligible)
    .reduce((sum, item) => sum + item.subtotal, 0);
  const rotEligibleWithVat = rotEligibleLaborCost * 1.25;
  const rotAmountRaw = data.rotEnabled ? rotEligibleWithVat * (data.rotPercent / 100) : 0;
  const rotAmount = Math.min(rotAmountRaw, ROT_MAX);
  
  // RUT calculation - use rut_eligible items only
  const rutEligibleLaborCost = data.items
    .filter((item) => item.type === "labor" && item.rut_eligible)
    .reduce((sum, item) => sum + item.subtotal, 0);
  const rutEligibleWithVat = rutEligibleLaborCost * 1.25;
  const rutAmountRaw = data.rutEnabled ? rutEligibleWithVat * 0.5 : 0;
  const rutAmount = Math.min(rutAmountRaw, RUT_MAX);
  
  // Combined deduction with cap
  const combinedDeduction = Math.min(rotAmount + rutAmount, COMBINED_MAX);
  const amountToPay = totalInclVat - combinedDeduction;
  
  const hasAnyDeduction = data.rotEnabled || data.rutEnabled;

  // Helper to draw footer on each page
  const drawFooter = (pageNum: number, totalPages: number) => {
    const footerY = pageHeight - 25;
    
    // Divider line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY, pageWidth - margin, footerY);
    
    const colWidth = (pageWidth - margin * 2) / 4;
    let yPos = footerY + 5;
    
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Postadress", margin, yPos);
    doc.text("Telefon", margin + colWidth, yPos);
    doc.text("Bankgiro", margin + colWidth * 2, yPos);
    doc.text("Godkänd för F-skatt", margin + colWidth * 3, yPos);
    
    yPos += 4;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    
    // Postadress
    doc.text(data.company?.company_name || "–", margin, yPos);
    doc.text(data.company?.address || "–", margin, yPos + 3);
    doc.text(`${data.company?.postal_code || ""} ${data.company?.city || ""}`.trim() || "–", margin, yPos + 6);
    
    // Telefon
    doc.text(data.company?.phone || "–", margin + colWidth, yPos);
    
    // Bankgiro + Momsreg
    doc.text(data.company?.bankgiro || "–", margin + colWidth * 2, yPos);
    if (data.company?.momsregnr) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Momsreg.nr", margin + colWidth * 2, yPos + 5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(data.company.momsregnr, margin + colWidth * 2, yPos + 8);
    }
    
    // F-skatt
    doc.text(data.company?.f_skatt !== false ? "Ja" : "Nej", margin + colWidth * 3, yPos);
    
    // Page number
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Sida ${pageNum} (${totalPages})`, pageWidth - margin, pageHeight - 10, { align: "right" });
  };

  // ============================================
  // PAGE 1 - Main Quote
  // ============================================
  let yPos = margin;

  // Logo (if available) - fetch as blob to avoid CORS issues
  if (data.company?.logo_url) {
    try {
      // Fetch image as blob to bypass CORS restrictions
      const response = await fetch(data.company.logo_url);
      const blob = await response.blob();
      
      // Convert blob to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
      // Create image to get dimensions
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = base64;
      });
      
      const maxWidth = 40;
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
      
      doc.addImage(base64, 'PNG', margin, yPos, imgWidth, imgHeight);
    } catch (e) {
      console.warn("Could not load logo for PDF:", e);
    }
  }

  // Offert title (right side)
  doc.setFontSize(28);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text("Offert", pageWidth - margin, margin + 5, { align: "right" });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Nr: ${data.offerNumber}`, pageWidth - margin, margin + 12, { align: "right" });

  // Reference and customer info section
  yPos = 45;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  yPos += 8;
  const midX = pageWidth / 2;
  
  // Left: Vår referens
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "normal");
  doc.text("VÅR REFERENS", margin, yPos);
  
  yPos += 5;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  const refText = [data.company?.contact_person, data.company?.contact_phone].filter(Boolean).join(" ");
  doc.text(refText || "–", margin, yPos);
  
  yPos += 6;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Datum: ${format(today, "yyyy-MM-dd")}`, margin, yPos);

  // Right: Kund
  let rightY = 53;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("KUND", midX, rightY - 5);
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.text(data.customer?.name || "–", midX, rightY);
  
  if (data.customer?.address) {
    const addressLines = data.customer.address.split(",").map(s => s.trim());
    addressLines.forEach((line, idx) => {
      rightY += 5;
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(line, midX, rightY);
    });
  }

  yPos += 8;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, pageWidth - margin, yPos);

  // Project name
  yPos += 10;
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text(`Projekt: ${data.projectName}`, margin, yPos);

  // Projektbeskrivning
  yPos += 10;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Projektbeskrivning", margin, yPos);
  
  yPos += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  const scopeLines = doc.splitTextToSize(data.scope || "Ej angiven", pageWidth - margin * 2);
  doc.text(scopeLines, margin, yPos);
  yPos += scopeLines.length * 4 + 6;

  // Arbete (conditions/assumptions)
  if (data.conditions && data.conditions.length > 0) {
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Arbete:", margin, yPos);
    
    yPos += 5;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    
    data.conditions.forEach((condition) => {
      doc.text(`•  ${condition}`, margin, yPos);
      yPos += 4;
    });
    yPos += 4;
  }

  // Price table - handle show_only_total
  const tableData = data.items.map((item) => {
    const description = item.description || item.moment;
    if (item.show_only_total) {
      return [description, "–", "–", "–", formatNumber(item.subtotal)];
    }
    return [
      description,
      item.type === "labor" ? (item.hours?.toString() || "–") : (item.quantity?.toString() || "–"),
      item.type === "labor" ? "h" : (item.unit || "–"),
      formatNumber(item.unit_price),
      formatNumber(item.subtotal),
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [["Beskrivning", "Antal", "Enhet", "À-pris", "Summa"]],
    body: tableData,
    theme: "plain",
    styles: {
      fontSize: 9,
      cellPadding: 2,
      textColor: [50, 50, 50],
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      lineWidth: { bottom: 0.5 },
      lineColor: [150, 150, 150],
    },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { halign: "right", cellWidth: 18 },
      2: { halign: "right", cellWidth: 16 },
      3: { halign: "right", cellWidth: 25 },
      4: { halign: "right", cellWidth: 25 },
    },
    margin: { left: margin, right: margin },
  });

  yPos = (doc as any).lastAutoTable.finalY + 2;

  // Totals section
  const totalsX = pageWidth - margin - 60;
  const valuesX = pageWidth - margin;
  
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  yPos += 6;
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text("Summa exkl. moms", totalsX, yPos, { align: "right" });
  doc.text(`${formatNumber(totalExclVat)} kr`, valuesX, yPos, { align: "right" });
  
  yPos += 5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("Moms 25%", totalsX, yPos, { align: "right" });
  doc.text(`${formatNumber(vat)} kr`, valuesX, yPos, { align: "right" });
  
  yPos += 6;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(totalsX - 40, yPos - 2, pageWidth - margin, yPos - 2);
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text("Totalt inkl. moms", totalsX, yPos + 3, { align: "right" });
  doc.text(`${formatNumber(totalInclVat)} kr`, valuesX, yPos + 3, { align: "right" });
  
  if (hasAnyDeduction) {
    yPos += 10;
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 100, 100);
    
    if (data.rotEnabled && rotAmount > 0) {
      doc.text(`* ${data.rotPercent}% ROT-avdrag inkl moms`, totalsX, yPos, { align: "right" });
      doc.text(`-${formatNumber(rotAmount)} kr`, valuesX, yPos, { align: "right" });
      yPos += 5;
    }
    
    if (data.rutEnabled && rutAmount > 0) {
      doc.text(`* 50% RUT-avdrag inkl moms`, totalsX, yPos, { align: "right" });
      doc.text(`-${formatNumber(rutAmount)} kr`, valuesX, yPos, { align: "right" });
      yPos += 5;
    }
    
    yPos += 3;
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(totalsX - 50, yPos - 4, 110, 12, 2, 2, "F");
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Att betala", totalsX, yPos + 3, { align: "right" });
    doc.text(`${formatNumber(amountToPay)} kr`, valuesX, yPos + 3, { align: "right" });
  }

  drawFooter(1, 3);

  // ============================================
  // PAGE 2 - Acceptance
  // ============================================
  doc.addPage();
  yPos = margin;

  // Logo - fetch as blob to avoid CORS issues
  if (data.company?.logo_url) {
    try {
      const response = await fetch(data.company.logo_url);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = base64;
      });
      const maxWidth = 35;
      const maxHeight = 15;
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
      doc.addImage(base64, 'PNG', margin, yPos, imgWidth, imgHeight);
    } catch (e) {
      console.warn("Could not load logo for PDF page 2:", e);
    }
  }

  // Offer number right
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.text(`Offert Nr: ${data.offerNumber}`, pageWidth - margin, margin + 5, { align: "right" });

  yPos = 50;
  doc.setFontSize(12);
  doc.setTextColor(50, 50, 50);
  doc.text("Med vänliga hälsningar", margin, yPos);

  yPos += 12;
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text(data.company?.contact_person || "–", margin, yPos);
  
  yPos += 6;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  if (data.company?.contact_phone) {
    doc.text(`Mobil: ${data.company.contact_phone}`, margin, yPos);
    yPos += 5;
  }
  if (data.company?.email) {
    doc.text(`E-post: ${data.company.email}`, margin, yPos);
    yPos += 5;
  }

  yPos += 15;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, pageWidth - margin, yPos);

  yPos += 15;
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text("Acceptera ovanstående", margin, yPos);

  yPos += 15;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  doc.text("Ort:", margin, yPos);
  doc.setDrawColor(150, 150, 150);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin + 15, yPos, pageWidth - margin, yPos);

  yPos += 15;
  doc.text("Datum:", margin, yPos);
  doc.line(margin + 20, yPos, pageWidth - margin, yPos);

  yPos += 25;
  doc.line(margin, yPos, pageWidth - margin, yPos);
  doc.setLineDashPattern([], 0);
  
  yPos += 5;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "italic");
  doc.text("Namnteckning", margin, yPos);

  yPos += 20;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Undertecknat dokument mailas till ${data.company?.email || "info@foretag.se"}`, margin, yPos);

  drawFooter(2, 3);

  // ============================================
  // PAGE 3 - Terms
  // ============================================
  doc.addPage();
  yPos = margin;

  // Logo - fetch as blob to avoid CORS issues
  if (data.company?.logo_url) {
    try {
      const response = await fetch(data.company.logo_url);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = base64;
      });
      const maxWidth = 35;
      const maxHeight = 15;
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
      doc.addImage(base64, 'PNG', margin, yPos, imgWidth, imgHeight);
    } catch (e) {
      console.warn("Could not load logo for PDF page 3:", e);
    }
  }

  // Offer number right
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.text(`Offert Nr: ${data.offerNumber}`, pageWidth - margin, margin + 5, { align: "right" });

  yPos = 50;
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text("Förutsättningar & villkor", margin, yPos);

  yPos += 15;
  
  // Giltighetstid
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Offertens giltighetstid", margin, yPos);
  yPos += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  doc.text(`Offertens giltighetstid gäller ${validDays} dagar från ovanstående datum.`, margin, yPos);
  yPos += 4;
  doc.text(`Giltig t.o.m. ${format(validUntil, "yyyy-MM-dd")}.`, margin, yPos);
  
  yPos += 12;
  
  // Betalningsvillkor
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text("Betalningsvillkor", margin, yPos);
  yPos += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  doc.text("10 dagar netto.", margin, yPos);

  yPos += 12;

  // ÄTA
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text("ÄTA (ändrings- och tilläggsarbeten)", margin, yPos);
  yPos += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  const ataText = doc.splitTextToSize(
    "Skulle det under projektets gång uppstå oförutsedda förhållanden eller behov av ändringar som påverkar det avtalade arbetet, kommer vi att upprätta en separat ÄTA-offert (ändrings- och tilläggsarbeten) för godkännande innan arbetet påbörjas. Inget tillkommande arbete utförs utan skriftligt godkännande.",
    pageWidth - margin * 2
  );
  doc.text(ataText, margin, yPos);
  yPos += ataText.length * 4 + 8;

  // ROT/RUT
  if (data.rotEnabled || data.rutEnabled) {
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("ROT/RUT-avdrag", margin, yPos);
    yPos += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    const taxText = doc.splitTextToSize(
      "För fullständig information om hur ROT- och RUT-avdragen fungerar hänvisar vi till Skatteverkets hemsida www.skatteverket.se. Kunden ansvarar för att kraven för avdrag uppfylls. ROT-avdrag är max 50 000 kr per person/år. RUT-avdrag är max 75 000 kr per person/år. Kombinerat max 75 000 kr per person/år.",
      pageWidth - margin * 2
    );
    doc.text(taxText, margin, yPos);
    yPos += taxText.length * 4 + 8;
  }

  // Personuppgifter
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text("Personuppgifter", margin, yPos);
  yPos += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  const gdprText = doc.splitTextToSize(
    "Vid godkännande av denna offert accepterar du att vi behandlar dina personuppgifter för att kunna fullfölja vårt åtagande gentemot dig som kund. Den information vi behandlar för er är information som berörs och är nödvändig för byggprojektens administration. Personuppgifterna lagras och hanteras i projektverktyget Bygglet som har tekniska och organisatoriska säkerhetsåtgärder för att skydda hanteringen av Personuppgifter och lever upp till de krav som ställs enligt EU:s dataskyddsförordning (GDPR). Vi kommer om ni begär det att radera eller anonymisera och oavsett anledning därtill, inklusive att radera samtliga kopior som inte enligt GDPR måste sparas. Vi kommer inte att överföra Personuppgifter till land utanför EU/ESS",
    pageWidth - margin * 2
  );
  doc.text(gdprText, margin, yPos);
  yPos += gdprText.length * 4 + 8;

  // Övrigt
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text("Övrigt", margin, yPos);
  yPos += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  doc.text("•  Arbetet utförs enligt gällande branschregler", margin, yPos);
  yPos += 5;
  doc.text("•  Eventuella tillkommande arbeten faktureras enligt överenskommelse", margin, yPos);
  yPos += 5;
  doc.text("•  Garanti enligt konsumenttjänstlagen", margin, yPos);

  drawFooter(3, 3);

  // ============================================
  // SAVE FILE
  // ============================================
  const projectName = data.projectName
    .toLowerCase()
    .replace(/[^a-zåäö0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  const dateForFile = format(new Date(), "yyyy-MM-dd");
  const filename = `Offert_${data.offerNumber.replace(/[^a-zA-Z0-9]/g, "_")}_${projectName}_${dateForFile}.pdf`;

  doc.save(filename);
}
