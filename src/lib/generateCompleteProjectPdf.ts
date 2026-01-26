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
  work_items: string[] | null;
  notes: string | null;
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
  companySettings: CompanySettings | null;
}

const formatCurrency = (amount: number | null | undefined) => {
  if (!amount && amount !== 0) return "-";
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return "-";
  try {
    return format(new Date(dateString), "PPP", { locale: sv });
  } catch {
    return dateString;
  }
};

export async function generateCompleteProjectPdf(options: CompleteProjectPdfOptions) {
  const { project, estimate, estimateItems, ataItems, plan, diaryReports, companySettings } = options;

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

  // === PLANNING ===
  if (plan && plan.phases && plan.phases.length > 0) {
    checkPageBreak(40);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Projektplanering", 14, yPos);
    yPos += 10;

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

    yPos = (doc as any).lastAutoTable.finalY + 5;
    if (plan.total_weeks) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Total projektlängd: ${plan.total_weeks} veckor`, 14, yPos);
    }
    yPos += 15;
  }

  // === DIARY REPORTS ===
  if (diaryReports.length > 0) {
    checkPageBreak(40);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Arbetsdagbok", 14, yPos);
    yPos += 10;

    const diaryData = diaryReports.map((report) => [
      formatDate(report.report_date),
      report.headcount?.toString() || "-",
      report.total_hours?.toString() || "-",
      (report.work_items || []).slice(0, 2).join(", ") + (report.work_items && report.work_items.length > 2 ? "..." : ""),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Datum", "Personal", "Timmar", "Utfört arbete"]],
      body: diaryData,
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [60, 60, 60] },
      columnStyles: {
        3: { cellWidth: 80 },
      },
    });

    // Diary totals
    const totalHours = diaryReports.reduce((sum, r) => sum + (r.total_hours || 0), 0);
    yPos = (doc as any).lastAutoTable.finalY + 5;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Totalt arbetade timmar: ${totalHours}`, 14, yPos);
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

  const economyData = [
    ["Offertbelopp (inkl. moms)", formatCurrency(estimateTotal)],
    ["ÄTA-arbeten", formatCurrency(ataTotal)],
    ["Slutsumma", formatCurrency(grandTotal)],
  ];

  if (project.budget) {
    const diff = project.budget - grandTotal;
    economyData.push(["Budget", formatCurrency(project.budget)]);
    economyData.push(["Differens (Budget - Slutsumma)", formatCurrency(diff)]);
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
