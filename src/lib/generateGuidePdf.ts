import jsPDF from "jspdf";
import { getCompanyLogoBase64, PDF_COLORS } from "./pdfUtils";

interface CompanySettings {
  company_name: string | null;
  logo_url: string | null;
}

export async function generateGuidePdf(companySettings?: CompanySettings | null) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Get logo
  const logoBase64 = await getCompanyLogoBase64(companySettings?.logo_url || null);

  // Helper to add new page if needed
  const checkPageBreak = (height: number) => {
    if (y + height > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Helper for section headers
  const addSectionHeader = (text: string) => {
    checkPageBreak(20);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PDF_COLORS.DARK);
    doc.text(text, margin, y);
    y += 8;
    doc.setTextColor(...PDF_COLORS.DARK);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
  };

  // Helper for body text
  const addParagraph = (text: string) => {
    const lines = doc.splitTextToSize(text, contentWidth);
    checkPageBreak(lines.length * 5);
    doc.setTextColor(...PDF_COLORS.DARK);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 4;
  };

  // Helper for bullet points
  const addBullet = (text: string) => {
    const bulletMargin = margin + 5;
    const bulletWidth = contentWidth - 5;
    const lines = doc.splitTextToSize(text, bulletWidth);
    checkPageBreak(lines.length * 5);
    doc.setTextColor(...PDF_COLORS.MUTED);
    doc.text("-", margin, y);
    doc.setTextColor(...PDF_COLORS.DARK);
    doc.text(lines, bulletMargin, y);
    y += lines.length * 5 + 2;
  };

  // === COVER / HEADER ===
  
  // Header bar
  doc.setFillColor(...PDF_COLORS.HEADER_BG);
  doc.rect(0, 0, pageWidth, 6, "F");
  
  // Logo in top left if available
  y = 16;
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "AUTO", margin, y, 35, 18, undefined, "FAST");
    } catch (e) {
      console.error("Error adding logo:", e);
    }
  }

  // Title
  y = 50;
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PDF_COLORS.DARK);
  doc.text("BYGGIO GUIDE", margin, y);
  
  y += 10;
  doc.setFontSize(12);
  doc.setTextColor(...PDF_COLORS.MUTED);
  doc.setFont("helvetica", "normal");
  doc.text("Din kompletta guide till effektiv projekthantering", margin, y);
  
  y += 12;

  // Divider
  doc.setDrawColor(...PDF_COLORS.MUTED);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 12;

  // === SNABBSTART ===
  addSectionHeader("SNABBSTART");
  addParagraph(
    "Kom igang med Byggio pa bara tre enkla steg:"
  );
  addBullet("Steg 1: Skapa en offert - Anvand mallar eller bygg fran grunden med AI-stod");
  addBullet("Steg 2: Konvertera till projekt - Nar offerten godkanns, gor den till ett aktivt projekt");
  addBullet("Steg 3: Dokumentera arbetet - Anvand arbetsdagboken for att logga allt som hander");
  y += 4;

  // === PROJEKT & ARBETSDAGBOK ===
  addSectionHeader("PROJEKT & ARBETSDAGBOK");
  addParagraph(
    "Projekt ar hjartat i Byggio. Har samlas all information om dina aktiva jobb - fran offert till slutbesiktning. Arbetsdagboken later dig dokumentera det dagliga arbetet med rost eller text."
  );
  addBullet("Rostinspelning - Prata in din rapport direkt fran byggplatsen");
  addBullet("AI-strukturering - AI organiserar informationen automatiskt");
  addBullet("PDF-export - Exportera rapporter for arkivering");
  addBullet("ATA-hantering - Dokumentera och spara alla andringsarbeten");
  y += 4;

  // === OFFERTER ===
  addSectionHeader("OFFERTER & KALKYLER");
  addParagraph(
    "Skapa detaljerade offerter snabbt med hjalp av mallar och AI. Beskriv arbetet sa beraknas tid och kostnad automatiskt baserat pa dina timpriser och materialpriser."
  );
  addBullet("Valj en mall for din projekttyp (t.ex. badrumsrenovering)");
  addBullet("Beskriv mangder med rost eller text");
  addBullet("AI beraknar timmar och kostnader");
  addBullet("Justera paslag och exportera som professionell PDF");
  y += 4;

  // New page for more content
  doc.addPage();
  y = margin;

  // === PLANERING ===
  addSectionHeader("PLANERING & TIDSLINJE");
  addParagraph(
    "Skapa visuella tidsplaner for dina projekt. Beskriv projektets faser, sa genererar AI en Gantt-tidslinje som du kan exportera och dela med ditt team."
  );
  addBullet("Beskriv projektets faser och tidsramar");
  addBullet("AI skapar en visuell tidslinje");
  addBullet("Redigera och justera efter behov");
  addBullet("Exportera som PDF for att dela med teamet");
  y += 4;

  // === KUNDHANTERING ===
  addSectionHeader("KUNDHANTERING");
  addParagraph(
    "Samla all kundinformation pa ett stalle. Lagg till kontaktuppgifter, adresser och anteckningar for att halla ordning pa dina kundrelationer."
  );
  addBullet("Spara kontaktuppgifter och organisationsnummer");
  addBullet("Koppla kunder till projekt automatiskt");
  addBullet("Anteckningar och historik per kund");
  y += 4;

  // === EKONOMI ===
  addSectionHeader("EKONOMI & UPPFOLJNING");
  addParagraph(
    "Folj projektets ekonomi i realtid. Jamfor offert mot faktisk kostnad och se hur projektet utvecklas ekonomiskt."
  );
  addBullet("Oversikt over alla projekt och deras status");
  addBullet("Jamfor offererat mot fakturerat");
  addBullet("ATA-summering per projekt");
  addBullet("Kommande integrationer med Fortnox och Visma");
  y += 4;

  // === TIPS ===
  addSectionHeader("TIPS FOR BASTA RESULTAT");
  addBullet("Anvand rostinspelning - snabbaste sattet att dokumentera fran faltet");
  addBullet("Granska AI-genererat innehall innan du sparar eller skickar");
  addBullet("Skapa egna mallar for arbetsmoment du ofta aterkommer till");
  addBullet("Dokumentera ATA direkt - det sparar tid vid fakturering");
  addBullet("Exportera viktiga dokument som PDF for saker arkivering");
  y += 8;

  // === FAQ ===
  addSectionHeader("VANLIGA FRAGOR");
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...PDF_COLORS.DARK);
  doc.text("Kan jag anvanda Byggio pa mobilen?", margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...PDF_COLORS.MUTED);
  const mobileAnswer = doc.splitTextToSize(
    "Ja! Byggio ar optimerat for mobil anvandning. Du kan enkelt dokumentera arbete direkt fran byggplatsen.",
    contentWidth
  );
  doc.text(mobileAnswer, margin, y);
  y += mobileAnswer.length * 5 + 6;

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PDF_COLORS.DARK);
  doc.text("Hur fungerar AI-funktionerna?", margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...PDF_COLORS.MUTED);
  const aiAnswer = doc.splitTextToSize(
    "AI hjalper dig att strukturera information automatiskt. Du kan alltid redigera resultatet innan du sparar.",
    contentWidth
  );
  doc.text(aiAnswer, margin, y);
  y += aiAnswer.length * 5 + 6;

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PDF_COLORS.DARK);
  doc.text("Kan jag exportera mina dokument?", margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...PDF_COLORS.MUTED);
  const exportAnswer = doc.splitTextToSize(
    "Ja, alla dokument kan exporteras som professionella PDF-filer med din foretagslogga.",
    contentWidth
  );
  doc.text(exportAnswer, margin, y);
  y += exportAnswer.length * 5 + 6;

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...PDF_COLORS.MUTED);
    doc.text("Byggio - Byggprojekt, enkelt och digitalt", margin, pageHeight - 10);
    doc.text(`Sida ${i} av ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: "right" });
  }

  // Save
  doc.save("byggio-guide.pdf");
}
