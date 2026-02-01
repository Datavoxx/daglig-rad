import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { PDF_COLORS, getCompanyLogoBase64 } from "./pdfUtils";

interface CompanyInfo {
  company_name?: string;
  org_number?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  phone?: string;
  email?: string;
  bankgiro?: string;
  logo_url?: string;
  contact_person?: string;
  contact_phone?: string;
  momsregnr?: string;
  f_skatt?: boolean;
}

interface InvoiceRow {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  subtotal: number;
}

interface InvoiceData {
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  rows: InvoiceRow[];
  total_ex_vat: number;
  vat_amount: number;
  total_inc_vat: number;
  payment_terms?: string;
}

interface GenerateOptions {
  invoice: InvoiceData;
  company?: CompanyInfo;
  customerName?: string;
  projectName?: string;
}

export async function generateCustomerInvoicePdf(options: GenerateOptions): Promise<void> {
  const { invoice, company, customerName, projectName } = options;
  
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  // Footer function with legally required company information
  const drawFooter = () => {
    const footerY = pageHeight - 25;
    
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY, pageWidth - margin, footerY);
    
    const colWidth = (pageWidth - margin * 2) / 4;
    let y = footerY + 5;
    
    // Headers
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Postadress", margin, y);
    doc.text("Telefon", margin + colWidth, y);
    doc.text("Bankgiro", margin + colWidth * 2, y);
    doc.text("Godkänd för F-skatt", margin + colWidth * 3, y);
    
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    
    // Column 1: Postal address
    doc.text(company?.company_name || "–", margin, y);
    doc.text(company?.address || "–", margin, y + 3);
    doc.text(`${company?.postal_code || ""} ${company?.city || ""}`.trim() || "–", margin, y + 6);
    
    // Column 2: Phone & Email
    doc.text(company?.phone || "–", margin + colWidth, y);
    if (company?.email) {
      doc.text(company.email, margin + colWidth, y + 3);
    }
    
    // Column 3: Bankgiro + VAT + Org.nr
    doc.text(company?.bankgiro || "–", margin + colWidth * 2, y);
    if (company?.momsregnr) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Momsreg.nr", margin + colWidth * 2, y + 5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(company.momsregnr, margin + colWidth * 2, y + 8);
    }
    if (company?.org_number) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Org.nr", margin + colWidth * 2, y + 12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(company.org_number, margin + colWidth * 2, y + 15);
    }
    
    // Column 4: F-skatt status
    doc.text(company?.f_skatt !== false ? "Ja" : "Nej", margin + colWidth * 3, y);
  };

  const formatNumber = (num: number) => new Intl.NumberFormat("sv-SE").format(Math.round(num));

  let yPos = margin;

  // Logo
  if (company?.logo_url) {
    try {
      const logoBase64 = await getCompanyLogoBase64(company.logo_url);
      if (logoBase64) {
        doc.addImage(logoBase64, "PNG", margin, yPos, 40, 20);
      }
    } catch (e) { console.warn("Logo error:", e); }
  }

  // Title
  doc.setFontSize(28);
  doc.setTextColor(PDF_COLORS.DARK[0], PDF_COLORS.DARK[1], PDF_COLORS.DARK[2]);
  doc.setFont("helvetica", "bold");
  doc.text("FAKTURA", pageWidth - margin, margin + 5, { align: "right" });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Nr: ${invoice.invoice_number}`, pageWidth - margin, margin + 12, { align: "right" });

  yPos = 45;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  yPos += 8;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("VÅR REFERENS", margin, yPos);
  doc.text("KUND", pageWidth / 2, yPos);
  
  yPos += 5;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(company?.contact_person || "–", margin, yPos);
  doc.text(customerName || "–", pageWidth / 2, yPos);
  
  yPos += 6;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Fakturadatum: ${invoice.invoice_date}`, margin, yPos);
  doc.text(`Förfallodatum: ${invoice.due_date}`, margin, yPos + 5);

  yPos += 14;
  doc.line(margin, yPos, pageWidth - margin, yPos);

  if (projectName) {
    yPos += 10;
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(`Projekt: ${projectName}`, margin, yPos);
    yPos += 8;
  } else {
    yPos += 10;
  }

  // Table
  const tableData = invoice.rows.map((row) => [
    row.description || "–",
    row.quantity?.toString() || "–",
    row.unit || "–",
    formatNumber(row.unit_price || 0),
    formatNumber(row.subtotal || 0),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Beskrivning", "Antal", "Enhet", "À-pris", "Summa"]],
    body: tableData,
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 3, textColor: [50, 50, 50] },
    headStyles: {
      fillColor: [PDF_COLORS.HEADER_BG[0], PDF_COLORS.HEADER_BG[1], PDF_COLORS.HEADER_BG[2]],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { halign: "right", cellWidth: 20 },
      2: { halign: "center", cellWidth: 18 },
      3: { halign: "right", cellWidth: 28 },
      4: { halign: "right", cellWidth: 28 },
    },
    margin: { left: margin, right: margin },
  });

  yPos = (doc as any).lastAutoTable.finalY + 4;
  const totalsX = pageWidth - margin - 60;
  const valuesX = pageWidth - margin;
  
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  yPos += 8;
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text("Summa exkl. moms", totalsX, yPos, { align: "right" });
  doc.text(`${formatNumber(invoice.total_ex_vat)} kr`, valuesX, yPos, { align: "right" });
  
  yPos += 6;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("Moms 25%", totalsX, yPos, { align: "right" });
  doc.text(`${formatNumber(invoice.vat_amount)} kr`, valuesX, yPos, { align: "right" });
  
  yPos += 8;
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(totalsX - 50, yPos, 110, 14, 2, 2, "F");
  
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text("ATT BETALA", totalsX, yPos + 9, { align: "right" });
  doc.text(`${formatNumber(invoice.total_inc_vat)} kr`, valuesX, yPos + 9, { align: "right" });

  // Payment info
  yPos += 30;
  doc.setFontSize(10);
  doc.text("Betalningsinformation", margin, yPos);
  yPos += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  if (company?.bankgiro) {
    doc.text(`Bankgiro: ${company.bankgiro}`, margin, yPos);
    yPos += 5;
  }
  doc.text(`Betalvillkor: ${invoice.payment_terms || "30 dagar netto"}`, margin, yPos);
  yPos += 5;
  doc.text(`OCR/Referens: ${invoice.invoice_number}`, margin, yPos);

  // Draw footer with legally required company information
  drawFooter();

  doc.save(`Faktura_${invoice.invoice_number}_${format(new Date(), "yyyy-MM-dd")}.pdf`);
}
