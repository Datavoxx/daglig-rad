import type { TimeEntryForExport } from "./validatePayrollExport";

/**
 * Generates a Fortnox Lön compatible PAXml 2.0 file
 * for payroll import.
 *
 * File format:
 * - Encoding: ISO-8859-1
 * - Extension: .xml
 * - Schema: http://www.paxml.se/2.0/paxml.xsd
 */

interface PaXmlExportOptions {
  entries: TimeEntryForExport[];
  periodStart: Date;
  periodEnd: Date;
  exportId: string;
  orgNumber?: string;
  companyName?: string;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatNumber(num: number, decimals: number = 2): string {
  return num.toFixed(decimals);
}

function formatDate(dateStr: string): string {
  return dateStr.split("T")[0];
}

function formatIsoDateTime(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, "");
}

export function generatePaXmlXml(options: PaXmlExportOptions): string {
  const { entries, periodStart, periodEnd, exportId, orgNumber, companyName } = options;

  const lines: string[] = [];

  // XML declaration
  lines.push('<?xml version="1.0" encoding="ISO-8859-1" standalone="yes"?>');

  // Root element with schema reference
  lines.push('<paxml xsi:noNamespaceSchemaLocation="http://www.paxml.se/2.0/paxml.xsd"');
  lines.push('       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">');

  // Header
  lines.push("  <header>");
  lines.push("    <version>2.0</version>");
  lines.push("    <format>LONIN</format>");
  lines.push(`    <datum>${formatIsoDateTime(new Date())}</datum>`);
  if (orgNumber) {
    lines.push(`    <foretagid>${escapeXml(orgNumber)}</foretagid>`);
  }
  if (companyName) {
    lines.push(`    <foretagnamn>${escapeXml(companyName)}</foretagnamn>`);
  }
  lines.push(`    <extrainfo>Export-ID: ${exportId}</extrainfo>`);
  lines.push("  </header>");

  // Group entries by employee for tidtransaktioner
  const entriesByEmployee = new Map<string, TimeEntryForExport[]>();
  for (const entry of entries) {
    if (!entry.employee || !entry.salary_type?.fortnox_wage_code) {
      continue;
    }
    const empId = entry.employee.fortnox_employee_id || entry.employee.employment_number || "";
    if (!empId) continue;

    if (!entriesByEmployee.has(empId)) {
      entriesByEmployee.set(empId, []);
    }
    entriesByEmployee.get(empId)!.push(entry);
  }

  // Tidtransaktioner section
  lines.push("  <tidtransaktioner>");

  for (const [employeeId, empEntries] of entriesByEmployee) {
    for (const entry of empEntries) {
      lines.push(`    <tidtrans anstid="${escapeXml(employeeId)}">`);
      lines.push(`      <datum>${formatDate(entry.date)}</datum>`);
      lines.push(`      <tidkod>${escapeXml(entry.salary_type!.fortnox_wage_code!)}</tidkod>`);
      lines.push(`      <antal>${formatNumber(entry.hours)}</antal>`);

      // Optional: löneart
      if (entry.salary_type?.fortnox_salary_type) {
        lines.push(`      <loneart>${escapeXml(entry.salary_type.fortnox_salary_type)}</loneart>`);
      }

      // Optional: kommentar
      if (entry.description) {
        lines.push(`      <kommentar>${escapeXml(entry.description.substring(0, 100))}</kommentar>`);
      }

      lines.push("    </tidtrans>");
    }
  }

  lines.push("  </tidtransaktioner>");
  lines.push("</paxml>");

  return lines.join("\n");
}

/**
 * Converts UTF-8 string to ISO-8859-1 encoded ArrayBuffer
 */
function utf8ToIso88591(str: string): ArrayBuffer {
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    bytes[i] = code <= 0xFF ? code : 0x3F;
  }
  return bytes.buffer;
}

export function generatePaXmlFile(options: PaXmlExportOptions): Blob {
  const xmlContent = generatePaXmlXml(options);
  const isoBuffer = utf8ToIso88591(xmlContent);
  return new Blob([isoBuffer], { type: "application/xml; charset=ISO-8859-1" });
}

export function downloadPaXmlFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function generatePaXmlFilename(periodStart: Date, orgNumber?: string): string {
  const yearMonth = periodStart.toISOString().split("T")[0].substring(0, 7);
  const org = orgNumber?.replace(/-/g, "") || "ORGNR";
  return `BYGGIO_FORTNOX_${yearMonth}_${org}.xml`;
}
