import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface Project {
  id: string;
  name: string;
  client_name: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  start_date: string | null;
  budget: number | null;
  status: string | null;
}

interface EstimateItem {
  id: string;
  moment: string;
  article: string | null;
  description: string | null;
  quantity: number | null;
  unit: string | null;
  unit_price: number | null;
  subtotal: number | null;
  type: string;
}

interface Estimate {
  id: string;
  offer_number: string | null;
  manual_project_name: string | null;
  total_incl_vat: number | null;
  total_excl_vat: number | null;
  status: string;
}

interface AtaItem {
  id: string;
  ata_number: string | null;
  description: string;
  article: string | null;
  quantity: number | null;
  unit: string | null;
  unit_price: number | null;
  subtotal: number | null;
  status: string | null;
}

interface Phase {
  name: string;
  color: string;
  start_week: number;
  duration_weeks: number;
  description?: string | null;
}

interface Plan {
  id: string;
  phases: Phase[];
  total_weeks: number | null;
  start_date: string | null;
}

interface DiaryReport {
  id: string;
  report_date: string;
  headcount: number | null;
  total_hours: number | null;
  hours_per_person: number | null;
  work_items: string[] | null;
  roles: string[] | null;
  deviations: any | null;
  extra_work: string[] | null;
  materials_delivered: string[] | null;
  materials_missing: string[] | null;
  notes: string | null;
}

interface TimeEntry {
  id: string;
  date: string;
  hours: number;
  description: string | null;
  billing_type_name: string | null;
  salary_type_name: string | null;
  user_name: string | null;
  billing_rate?: number | null;
}

interface WorkOrder {
  id: string;
  order_number: string | null;
  title: string;
  description: string | null;
  assigned_to: string | null;
  due_date: string | null;
  status: string | null;
}

interface ProjectFile {
  id: string;
  file_name: string;
  category: string | null;
  created_at: string;
  storage_path: string;
}

interface VendorInvoice {
  id: string;
  supplier_name: string;
  invoice_number: string | null;
  invoice_date: string | null;
  total_inc_vat: number;
  status: string;
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

interface CompleteProjectPdfOptions {
  project: Project;
  estimate: Estimate | null;
  estimateItems: EstimateItem[];
  ataItems: AtaItem[];
  plan: Plan | null;
  diaryReports: DiaryReport[];
  timeEntries?: TimeEntry[];
  workOrders?: WorkOrder[];
  projectFiles?: ProjectFile[];
  vendorInvoices?: VendorInvoice[];
  companySettings: CompanySettings | null;
}

const formatCurrency = (amount: number | null | undefined) => {
  if (!amount && amount !== 0) return "-";
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  const formatted = abs.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${isNegative ? "-" : ""}${formatted} kr`;
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return "-";
  try {
    return format(new Date(dateString), "PPP", { locale: sv });
  } catch {
    return dateString;
  }
};

const formatShortDate = (dateString: string | null) => {
  if (!dateString) return "-";
  try {
    return format(new Date(dateString), "d MMMM yyyy", { locale: sv });
  } catch {
    return dateString;
  }
};

// Helper to fetch image as base64
async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// Helper to check if file is an image
function isImageFile(fileName: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
  const lowerName = fileName.toLowerCase();
  return imageExtensions.some(ext => lowerName.endsWith(ext));
}

export async function generateCompleteProjectPdf(options: CompleteProjectPdfOptions) {
  const { project, estimate, estimateItems, ataItems, plan, diaryReports, timeEntries = [], workOrders = [], projectFiles = [], vendorInvoices = [], companySettings } = options;

  const doc = new jsPDF();
  let yPos = 20;

  // Helper to add page if needed
  const checkPageBreak = (neededSpace: number) => {
    if (yPos + neededSpace > 270) {
      doc.addPage();
      yPos = 20;
    }
  };

  // === COVER PAGE ===
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("Projektrapport", 105, 60, { align: "center" });

  doc.setFontSize(18);
  doc.setFont("helvetica", "normal");
  doc.text(project.name, 105, 80, { align: "center" });

  doc.setFontSize(12);
  doc.setTextColor(100);
  
  yPos = 100;
  
  if (project.client_name) {
    doc.text(`Kund: ${project.client_name}`, 105, yPos, { align: "center" });
    yPos += 8;
  }
  
  if (project.address) {
    doc.text(`Adress: ${project.address}`, 105, yPos, { align: "center" });
    yPos += 8;
  }
  
  if (project.city) {
    doc.text(`${project.postal_code || ""} ${project.city}`, 105, yPos, { align: "center" });
    yPos += 8;
  }

  yPos += 10;
  doc.text(`Genererad: ${format(new Date(), "PPP", { locale: sv })}`, 105, yPos, { align: "center" });

  // Company info at bottom
  if (companySettings?.company_name) {
    doc.setFontSize(10);
    doc.text(companySettings.company_name, 105, 250, { align: "center" });
    if (companySettings.address) {
      doc.text(`${companySettings.address}, ${companySettings.postal_code || ""} ${companySettings.city || ""}`, 105, 257, { align: "center" });
    }
    if (companySettings.phone || companySettings.email) {
      doc.text(`${companySettings.phone || ""} | ${companySettings.email || ""}`, 105, 264, { align: "center" });
    }
  }

  // === PAGE 2: PROJECT SUMMARY ===
  doc.addPage();
  doc.setTextColor(0);
  yPos = 20;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Projektöversikt", 14, yPos);
  yPos += 15;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const summaryData = [
    ["Projektnamn", project.name],
    ["Kund", project.client_name || "-"],
    ["Adress", `${project.address || ""} ${project.postal_code || ""} ${project.city || ""}`.trim() || "-"],
    ["Startdatum", formatDate(project.start_date)],
    ["Status", project.status === "completed" ? "Avslutat" : project.status || "-"],
    ["Budget", formatCurrency(project.budget)],
  ];

  if (estimate) {
    summaryData.push(["Offertnummer", estimate.offer_number || "-"]);
    summaryData.push(["Offertbelopp", formatCurrency(estimate.total_incl_vat)]);
  }

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: summaryData,
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 50 },
      1: { cellWidth: 100 },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 20;

  // === ESTIMATE ITEMS ===
  if (estimateItems.length > 0) {
    checkPageBreak(40);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Offertposter", 14, yPos);
    yPos += 10;

    const itemsData = estimateItems.map((item) => [
      item.article || "-",
      item.description || item.moment,
      item.quantity?.toString() || "-",
      item.unit || "-",
      formatCurrency(item.unit_price),
      formatCurrency(item.subtotal),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Artikel", "Beskrivning", "Antal", "Enhet", "À-pris", "Summa"]],
      body: itemsData,
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [60, 60, 60] },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // === ÄTA ITEMS ===
  if (ataItems.length > 0) {
    checkPageBreak(40);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("ÄTA-arbeten", 14, yPos);
    yPos += 10;

    const ataData = ataItems.map((item) => [
      item.ata_number || "-",
      item.description,
      item.article || "-",
      item.quantity?.toString() || "-",
      formatCurrency(item.unit_price),
      formatCurrency(item.subtotal),
      item.status === "approved" ? "Godkänd" : item.status === "pending" ? "Väntande" : item.status || "-",
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["ÄTA-nr", "Beskrivning", "Artikel", "Antal", "À-pris", "Summa", "Status"]],
      body: ataData,
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [60, 60, 60] },
    });

    // ÄTA total
    const ataTotal = ataItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    yPos = (doc as any).lastAutoTable.finalY + 5;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Total ÄTA: ${formatCurrency(ataTotal)}`, 14, yPos);
    yPos += 15;
  }

  // === PLANNING (EXPANDED) ===
  if (plan && plan.phases && plan.phases.length > 0) {
    checkPageBreak(40);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Projektplanering", 14, yPos);
    yPos += 10;

    // Overview table
    const planData = plan.phases.map((phase, index) => [
      `Fas ${index + 1}`,
      phase.name,
      `Vecka ${phase.start_week}`,
      `${phase.duration_weeks} veckor`,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["#", "Fas", "Start", "Längd"]],
      body: planData,
      theme: "striped",
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [60, 60, 60] },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Phase details section
    const phasesWithDescriptions = plan.phases.filter(p => p.description);
    if (phasesWithDescriptions.length > 0) {
      checkPageBreak(30);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Fasdetaljer", 14, yPos);
      yPos += 8;

      for (const phase of plan.phases) {
        if (!phase.description) continue;
        
        checkPageBreak(25);
        
        // Phase header
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`${phase.name} (Vecka ${phase.start_week} - ${phase.start_week + phase.duration_weeks - 1})`, 14, yPos);
        yPos += 5;
        
        // Phase description
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        const descLines = doc.splitTextToSize(phase.description, 180);
        doc.text(descLines, 14, yPos);
        yPos += descLines.length * 4 + 8;
      }
    }

    if (plan.total_weeks) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`Total projektlängd: ${plan.total_weeks} veckor`, 14, yPos);
    }
    yPos += 15;
  }

  // === DIARY REPORTS (EXPANDED) ===
  if (diaryReports.length > 0) {
    doc.addPage();
    yPos = 20;
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Arbetsdagbok", 14, yPos);
    yPos += 15;

    for (const report of diaryReports) {
      checkPageBreak(60);
      
      // Report header with date
      doc.setFillColor(245, 245, 245);
      doc.rect(14, yPos - 5, 182, 12, "F");
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(formatShortDate(report.report_date), 16, yPos + 2);
      
      // Personnel & hours info
      const personnelInfo: string[] = [];
      if (report.headcount) personnelInfo.push(`Personal: ${report.headcount}`);
      if (report.total_hours) personnelInfo.push(`Timmar: ${report.total_hours}`);
      if (report.hours_per_person) personnelInfo.push(`Tim/person: ${report.hours_per_person}`);
      
      if (personnelInfo.length > 0) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(personnelInfo.join(" • "), 196, yPos + 2, { align: "right" });
      }
      
      yPos += 12;

      // Roles if available
      if (report.roles && report.roles.length > 0) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("Roller:", 16, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(report.roles.join(", "), 36, yPos);
        yPos += 6;
      }

      // Work items
      if (report.work_items && report.work_items.length > 0) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("Utfört arbete:", 16, yPos);
        yPos += 5;
        
        doc.setFont("helvetica", "normal");
        for (const item of report.work_items) {
          checkPageBreak(8);
          const lines = doc.splitTextToSize(`• ${item}`, 170);
          doc.text(lines, 20, yPos);
          yPos += lines.length * 4;
        }
        yPos += 3;
      }

      // Deviations
      if (report.deviations && Array.isArray(report.deviations) && report.deviations.length > 0) {
        checkPageBreak(15);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(180, 80, 0);
        doc.text("Avvikelser:", 16, yPos);
        yPos += 5;
        
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0);
        for (const dev of report.deviations) {
          const devText = typeof dev === 'string' ? dev : (dev.description || JSON.stringify(dev));
          const lines = doc.splitTextToSize(`• ${devText}`, 170);
          doc.text(lines, 20, yPos);
          yPos += lines.length * 4;
        }
        yPos += 3;
      }

      // Extra work
      if (report.extra_work && report.extra_work.length > 0) {
        checkPageBreak(15);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("Extraarbete:", 16, yPos);
        yPos += 5;
        
        doc.setFont("helvetica", "normal");
        for (const item of report.extra_work) {
          const lines = doc.splitTextToSize(`• ${item}`, 170);
          doc.text(lines, 20, yPos);
          yPos += lines.length * 4;
        }
        yPos += 3;
      }

      // Materials
      const hasDelivered = report.materials_delivered && report.materials_delivered.length > 0;
      const hasMissing = report.materials_missing && report.materials_missing.length > 0;
      
      if (hasDelivered || hasMissing) {
        checkPageBreak(20);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("Material:", 16, yPos);
        yPos += 5;
        
        doc.setFont("helvetica", "normal");
        if (hasDelivered) {
          doc.text(`Levererat: ${report.materials_delivered!.join(", ")}`, 20, yPos);
          yPos += 5;
        }
        if (hasMissing) {
          doc.setTextColor(180, 0, 0);
          doc.text(`Saknas: ${report.materials_missing!.join(", ")}`, 20, yPos);
          doc.setTextColor(0);
          yPos += 5;
        }
        yPos += 3;
      }

      // Notes
      if (report.notes) {
        checkPageBreak(15);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("Anteckningar:", 16, yPos);
        yPos += 5;
        
        doc.setFont("helvetica", "italic");
        const noteLines = doc.splitTextToSize(report.notes, 170);
        doc.text(noteLines, 20, yPos);
        yPos += noteLines.length * 4;
      }

      yPos += 10; // Space between reports
    }

    // Diary totals
    const totalDiaryHours = diaryReports.reduce((sum, r) => sum + (r.total_hours || 0), 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Totalt arbetade timmar (dagbok): ${totalDiaryHours}`, 14, yPos);
    yPos += 15;
  }

  // === TIME ENTRIES ===
  if (timeEntries.length > 0) {
    checkPageBreak(40);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Tidsrapporter", 14, yPos);
    yPos += 10;

    const timeData = timeEntries.map((entry) => [
      formatDate(entry.date),
      entry.user_name || "-",
      entry.hours.toFixed(1) + "h",
      entry.billing_type_name || "-",
      entry.description || "-",
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Datum", "Personal", "Timmar", "Debiteringstyp", "Beskrivning"]],
      body: timeData,
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [60, 60, 60] },
      columnStyles: {
        4: { cellWidth: 60 },
      },
    });

    // Time entries total
    const totalTimeHours = timeEntries.reduce((sum, e) => sum + e.hours, 0);
    yPos = (doc as any).lastAutoTable.finalY + 5;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Totalt: ${totalTimeHours.toFixed(1)} timmar`, 14, yPos);
    yPos += 15;
  }

  // === WORK ORDERS (EXPANDED) ===
  if (workOrders.length > 0) {
    doc.addPage();
    yPos = 20;
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Arbetsorder", 14, yPos);
    yPos += 15;

    for (const wo of workOrders) {
      checkPageBreak(35);
      
      // Work order card
      doc.setDrawColor(200);
      doc.setLineWidth(0.5);
      doc.roundedRect(14, yPos - 3, 182, wo.description ? 28 : 18, 2, 2, "S");
      
      // Order number and title
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      const orderLabel = wo.order_number ? `${wo.order_number}: ` : "";
      doc.text(`${orderLabel}${wo.title}`, 18, yPos + 4);
      
      // Status badge
      const statusText = wo.status === "completed" ? "Klar" : 
        wo.status === "in_progress" ? "Pågående" : "Väntande";
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(statusText, 188, yPos + 4, { align: "right" });
      
      // Meta info line
      const metaInfo: string[] = [];
      if (wo.assigned_to) metaInfo.push(`Tilldelad: ${wo.assigned_to}`);
      if (wo.due_date) metaInfo.push(`Förfaller: ${formatDate(wo.due_date)}`);
      
      if (metaInfo.length > 0) {
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(metaInfo.join(" • "), 18, yPos + 11);
        doc.setTextColor(0);
      }
      
      // Description
      if (wo.description) {
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        const descLines = doc.splitTextToSize(wo.description, 170);
        const displayLines = descLines.slice(0, 2); // Max 2 lines
        doc.text(displayLines, 18, yPos + 18);
      }

      yPos += wo.description ? 35 : 25;
    }

    yPos += 10;
  }

  // === PROJECT FILES WITH EMBEDDED IMAGES ===
  if (projectFiles.length > 0) {
    doc.addPage();
    yPos = 20;
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Projektfiler & bilagor", 14, yPos);
    yPos += 15;

    const imageFiles = projectFiles.filter(f => isImageFile(f.file_name));
    const otherFiles = projectFiles.filter(f => !isImageFile(f.file_name));

    // Render images
    if (imageFiles.length > 0) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Bilder", 14, yPos);
      yPos += 8;

      for (const file of imageFiles) {
        checkPageBreak(80);
        
        // Try to load and embed the image
        const publicUrl = `https://ddxcbbycvybdpbtufdqr.supabase.co/storage/v1/object/public/project-files/${file.storage_path}`;
        const base64Image = await fetchImageAsBase64(publicUrl);
        
        if (base64Image) {
          try {
            // Add image - max width 100, maintain aspect ratio
            const imgWidth = 100;
            const imgHeight = 75; // Approximate aspect ratio
            
            doc.addImage(base64Image, 'JPEG', 14, yPos, imgWidth, imgHeight);
            
            // File info to the right of image
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.text(file.file_name, 120, yPos + 5);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.text(`Uppladdad: ${formatShortDate(file.created_at)}`, 120, yPos + 12);
            
            yPos += imgHeight + 10;
          } catch {
            // If image fails, show as text
            doc.setFontSize(9);
            doc.text(`[Bild kunde inte laddas: ${file.file_name}]`, 14, yPos);
            yPos += 8;
          }
        } else {
          // Show filename if image couldn't be loaded
          doc.setFontSize(9);
          doc.text(`📷 ${file.file_name} - ${formatShortDate(file.created_at)}`, 14, yPos);
          yPos += 8;
        }
      }
    }

    // Render other files as list
    if (otherFiles.length > 0) {
      checkPageBreak(20);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Övriga filer", 14, yPos);
      yPos += 8;

      const filesData = otherFiles.map((f) => [
        f.file_name,
        f.category === "attachment" ? "Bilaga" : "Dokument",
        formatShortDate(f.created_at),
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [["Filnamn", "Typ", "Uppladdad"]],
        body: filesData,
        theme: "striped",
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [60, 60, 60] },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }
  }

  // === VENDOR INVOICES ===
  if (vendorInvoices.length > 0) {
    checkPageBreak(40);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Leverantörsfakturor", 14, yPos);
    yPos += 10;

    const vendorData = vendorInvoices.map((inv) => [
      inv.supplier_name,
      inv.invoice_number || "-",
      formatDate(inv.invoice_date),
      formatCurrency(inv.total_inc_vat),
      inv.status === "paid" ? "Betald" : 
        inv.status === "approved" ? "Godkänd" : "Ny",
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Leverantör", "Faktura-nr", "Datum", "Belopp", "Status"]],
      body: vendorData,
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [60, 60, 60] },
    });

    // Total leverantörskostnader
    const vendorTotalSection = vendorInvoices.reduce((sum, inv) => sum + inv.total_inc_vat, 0);
    yPos = (doc as any).lastAutoTable.finalY + 5;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Total leverantörskostnad: ${formatCurrency(vendorTotalSection)}`, 14, yPos);
    yPos += 15;
  }

  // === ECONOMIC SUMMARY ===
  doc.addPage();
  yPos = 20;
  
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Ekonomisk sammanfattning", 14, yPos);
  yPos += 15;

  const ataTotal = ataItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  const estimateTotal = estimate?.total_incl_vat || 0;
  const grandTotal = estimateTotal + ataTotal;
  const vendorTotal = vendorInvoices.reduce((sum, inv) => sum + inv.total_inc_vat, 0);
  const laborCost = timeEntries.reduce((sum, e) => sum + (e.hours * (e.billing_rate || 0)), 0);
  const totalCosts = vendorTotal + laborCost;

  const economyData: [string, string][] = [
    ["Offertbelopp (inkl. moms)", formatCurrency(estimateTotal)],
    ["ATA-arbeten", formatCurrency(ataTotal)],
    ["Slutsumma intakter", formatCurrency(grandTotal)],
    ["", ""],
    ["Leverantorskostnader", formatCurrency(vendorTotal)],
    ["Arbetskostnad (timmar x rate)", formatCurrency(laborCost)],
    ["Totala kostnader", formatCurrency(totalCosts)],
    ["", ""],
    ["Bruttoresultat", formatCurrency(grandTotal - totalCosts)],
  ];

  if (project.budget) {
    economyData.push(["", ""]);
    economyData.push(["Budget", formatCurrency(project.budget)]);
    const diff = project.budget - grandTotal;
    economyData.push(["Differens (Budget - Intäkter)", formatCurrency(diff)]);
  }

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: economyData,
    theme: "plain",
    styles: { fontSize: 11, cellPadding: 5 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 80 },
      1: { halign: "right", cellWidth: 60 },
    },
  });

  // Save the PDF
  const fileName = `${project.name.replace(/[^a-zA-Z0-9åäöÅÄÖ ]/g, "_")}_Projektrapport.pdf`;
  doc.save(fileName);
}
