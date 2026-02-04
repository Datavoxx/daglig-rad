import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { getCompanyLogoBase64 } from "./pdfUtils";
import type { TimeEntryForExport, ValidationResult } from "./validatePayrollExport";

interface PayrollPdfOptions {
  entries: TimeEntryForExport[];
  validation: ValidationResult;
  periodStart: Date;
  periodEnd: Date;
  exportId: string;
  companyName?: string;
}

export async function generatePayrollPdf(options: PayrollPdfOptions): Promise<jsPDF> {
  const { entries, validation, periodStart, periodEnd, exportId, companyName } = options;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Try to add company logo
  const logoBase64 = await getCompanyLogoBase64(null);
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", 14, yPos, 40, 20);
      yPos += 25;
    } catch {
      // Skip logo if it fails
    }
  }

  // Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("LÖNEUNDERLAG", pageWidth / 2, yPos, { align: "center" });
  yPos += 10;

  // Subtitle with period
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  const periodStr = `${format(periodStart, "d MMMM", { locale: sv })} - ${format(periodEnd, "d MMMM yyyy", { locale: sv })}`;
  doc.text(periodStr, pageWidth / 2, yPos, { align: "center" });
  yPos += 15;

  // Metadata box
  doc.setFillColor(245, 245, 245);
  doc.rect(14, yPos, pageWidth - 28, 25, "F");
  doc.setFontSize(9);
  doc.setTextColor(100);
  
  doc.text(`Export-ID: ${exportId}`, 18, yPos + 7);
  doc.text(`Exportdatum: ${format(new Date(), "yyyy-MM-dd HH:mm", { locale: sv })}`, 18, yPos + 14);
  if (companyName) {
    doc.text(`Företag: ${companyName}`, 18, yPos + 21);
  }
  
  doc.text(`Antal anställda: ${validation.summary.employeeCount}`, pageWidth - 80, yPos + 7);
  doc.text(`Antal tidposter: ${validation.summary.totalEntries}`, pageWidth - 80, yPos + 14);
  doc.text(`Totalt timmar: ${validation.summary.totalHours.toFixed(1)}h`, pageWidth - 80, yPos + 21);
  
  doc.setTextColor(0);
  yPos += 35;

  // Summary by time type
  if (Object.keys(validation.summary.entriesByTimeType).length > 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Sammanfattning per tidtyp", 14, yPos);
    yPos += 5;

    const timeTypeData = Object.entries(validation.summary.entriesByTimeType).map(([type, data]) => [
      type,
      data.count.toString(),
      `${data.hours.toFixed(1)}h`,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Tidtyp", "Antal poster", "Timmar"]],
      body: timeTypeData,
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Group entries by employee
  const entriesByEmployee = new Map<string, TimeEntryForExport[]>();
  for (const entry of entries) {
    const key = entry.employee?.name || "Okänd";
    if (!entriesByEmployee.has(key)) {
      entriesByEmployee.set(key, []);
    }
    entriesByEmployee.get(key)!.push(entry);
  }

  // Table for each employee
  for (const [employeeName, employeeEntries] of entriesByEmployee) {
    // Check if we need a new page
    if (yPos > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    
    const firstEntry = employeeEntries[0];
    const empId = firstEntry.employee?.employment_number || firstEntry.employee?.personal_number || "-";
    doc.text(`${employeeName} (${empId})`, 14, yPos);
    yPos += 5;

    // Calculate employee totals
    const empTotalHours = employeeEntries.reduce((sum, e) => sum + e.hours, 0);

    const tableData = employeeEntries
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((entry) => [
        format(new Date(entry.date), "yyyy-MM-dd"),
        entry.salary_type?.visma_wage_code || "-",
        entry.salary_type?.name || "-",
        `${entry.hours.toFixed(1)}h`,
        entry.description?.substring(0, 40) || "",
      ]);

    // Add total row
    tableData.push(["", "", "Summa", `${empTotalHours.toFixed(1)}h`, ""]);

    autoTable(doc, {
      startY: yPos,
      head: [["Datum", "Tidkod", "Lönetyp", "Timmar", "Beskrivning"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [100, 116, 139], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
      didParseCell: (data) => {
        // Bold the total row
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [229, 231, 235];
        }
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Footer on last page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(
      `Sida ${i} av ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  return doc;
}

export async function downloadPayrollPdf(options: PayrollPdfOptions): Promise<void> {
  const doc = await generatePayrollPdf(options);
  const periodStr = format(options.periodStart, "yyyyMM");
  doc.save(`loneunderlag_${periodStr}.pdf`);
}
