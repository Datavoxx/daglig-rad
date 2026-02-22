import type { TimeEntryForExport } from "./validatePayrollExport";

/**
 * Generates a Visma Lön 300/600 compatible TLU file (XML format)
 * according to Spiris specification.
 * 
 * File format:
 * - Encoding: ISO-8859-1 (ANSI)
 * - Extension: .tlu
 * - Namespace: http://schemas.spira.se/visma/lon/transaktioner/2.0
 */

interface TluExportOptions {
  entries: TimeEntryForExport[];
  periodStart: Date;
  periodEnd: Date;
  exportId: string;
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
  // Ensure YYYY-MM-DD format
  return dateStr.split("T")[0];
}

export function generateTluXml(options: TluExportOptions): string {
  const { entries, periodStart, periodEnd, exportId } = options;

  const lines: string[] = [];
  
  // XML declaration with ISO-8859-1 encoding
  lines.push('<?xml version="1.0" encoding="ISO-8859-1"?>');
  
  // Root element with namespace
  lines.push('<TransaktionsLista xmlns="http://schemas.spira.se/visma/lon/transaktioner/2.0">');
  
  // Add metadata comment
  const periodStartStr = periodStart.toISOString().split("T")[0];
  const periodEndStr = periodEnd.toISOString().split("T")[0];
  lines.push(`  <!-- Export-ID: ${exportId} -->`);
  lines.push(`  <!-- Period: ${periodStartStr} till ${periodEndStr} -->`);
  lines.push(`  <!-- Genererad: ${new Date().toISOString()} -->`);
  
  // Generate transaction rows
  for (const entry of entries) {
    if (!entry.employee || !entry.salary_type?.visma_wage_code) {
      // Skip invalid entries (should have been caught by validation)
      continue;
    }

    // Use employment number as primary identifier, fall back to personal number
    const employeeId = entry.employee.employment_number || entry.employee.personal_number || "";
    
    lines.push("  <TransaktionsRad>");
    
    // Employee identifier - prefer AnstNr over PersNr
    if (entry.employee.employment_number) {
      lines.push(`    <AnstNr>${escapeXml(entry.employee.employment_number)}</AnstNr>`);
    } else if (entry.employee.personal_number) {
      lines.push(`    <PersNr>${escapeXml(entry.employee.personal_number)}</PersNr>`);
    }
    
    // Date
    lines.push(`    <Datum>${formatDate(entry.date)}</Datum>`);
    
    // Time code (Tidkod)
    lines.push(`    <TidKod>${escapeXml(entry.salary_type.visma_wage_code)}</TidKod>`);
    
    // Optional: Löneart if specified
    if (entry.salary_type.visma_salary_type) {
      lines.push(`    <LonArt>${escapeXml(entry.salary_type.visma_salary_type)}</LonArt>`);
    }
    
    // Hours (Antal)
    lines.push(`    <Antal>${formatNumber(entry.hours)}</Antal>`);
    
    // Optional: Comment/description
    if (entry.description) {
      lines.push(`    <Kommentar>${escapeXml(entry.description.substring(0, 100))}</Kommentar>`);
    }
    
    lines.push("  </TransaktionsRad>");
  }
  
  lines.push("</TransaktionsLista>");
  
  return lines.join("\n");
}

/**
 * Converts UTF-8 string to ISO-8859-1 encoded ArrayBuffer
 * Characters outside ISO-8859-1 range are replaced with '?'
 */
function utf8ToIso88591(str: string): ArrayBuffer {
  const bytes = new Uint8Array(str.length);
  
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    bytes[i] = code <= 0xFF ? code : 0x3F; // Replace non-ISO-8859-1 with '?'
  }
  
  return bytes.buffer;
}

export function generateTluFile(options: TluExportOptions): Blob {
  const xmlContent = generateTluXml(options);
  const isoBuffer = utf8ToIso88591(xmlContent);
  
  return new Blob([isoBuffer], { type: "application/xml; charset=ISO-8859-1" });
}

export function downloadTluFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function generateTluFilename(periodStart: Date, _periodEnd: Date, orgNumber?: string): string {
  const yearMonth = periodStart.toISOString().split("T")[0].substring(0, 7);
  const org = orgNumber?.replace(/-/g, "") || "ORGNR";
  return `BYGGIO_VISMA_${yearMonth}_${org}.tlu`;
}
