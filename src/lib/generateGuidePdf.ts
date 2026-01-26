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
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PDF_COLORS.PRIMARY);
    doc.text(text, margin, y);
    y += 10;
    doc.setTextColor(...PDF_COLORS.DARK);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
  };

  // Helper for body text
  const addParagraph = (text: string) => {
    const lines = doc.splitTextToSize(text, contentWidth);
    checkPageBreak(lines.length * 6);
    doc.setTextColor(...PDF_COLORS.DARK);
    doc.text(lines, margin, y);
    y += lines.length * 6 + 4;
  };

  // Helper for bullet points
  const addBullet = (text: string) => {
    const bulletMargin = margin + 5;
    const bulletWidth = contentWidth - 5;
    const lines = doc.splitTextToSize(text, bulletWidth);
    checkPageBreak(lines.length * 6);
    doc.setTextColor(...PDF_COLORS.MUTED);
    doc.text("•", margin, y);
    doc.setTextColor(...PDF_COLORS.DARK);
    doc.text(lines, bulletMargin, y);
    y += lines.length * 6 + 2;
  };

  // === COVER / HEADER ===
  
  // Logo in top left if available
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "AUTO", margin, y, 40, 20, undefined, "FAST");
    } catch (e) {
      console.error("Error adding logo:", e);
    }
  }

  // Title
  y = 50;
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PDF_COLORS.PRIMARY);
  doc.text("Byggio Guide", margin, y);
  
  y += 12;
  doc.setFontSize(14);
  doc.setTextColor(...PDF_COLORS.MUTED);
  doc.setFont("helvetica", "normal");
  doc.text("Din kompletta guide till effektiv projekthantering", margin, y);
  
  y += 15;

  // Divider
  doc.setDrawColor(...PDF_COLORS.PRIMARY);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 15;

  // === SNABBSTART ===
  addSectionHeader("🚀 Snabbstart");
  addParagraph(
    "Kom igång med Byggio på bara tre enkla steg:"
  );
  addBullet("Steg 1: Skapa en offert – Använd mallar eller bygg från grunden med AI-stöd");
  addBullet("Steg 2: Konvertera till projekt – När offerten godkänns, gör den till ett aktivt projekt");
  addBullet("Steg 3: Dokumentera arbetet – Använd arbetsdagboken för att logga allt som händer");
  y += 6;

  // === PROJEKT & ARBETSDAGBOK ===
  addSectionHeader("📁 Projekt & Arbetsdagbok");
  addParagraph(
    "Projekt är hjärtat i Byggio. Här samlas all information om dina aktiva jobb – från offert till slutbesiktning. Arbetsdagboken låter dig dokumentera det dagliga arbetet med röst eller text."
  );
  addBullet("Röstinspelning – Prata in din rapport direkt från byggplatsen");
  addBullet("AI-strukturering – AI organiserar informationen automatiskt");
  addBullet("PDF-export – Exportera rapporter för arkivering");
  addBullet("ÄTA-hantering – Dokumentera och spåra alla ändringsarbeten");
  y += 6;

  // === OFFERTER ===
  addSectionHeader("💰 Offerter & Kalkyler");
  addParagraph(
    "Skapa detaljerade offerter snabbt med hjälp av mallar och AI. Beskriv arbetet så beräknas tid och kostnad automatiskt baserat på dina timpriser och materialpriser."
  );
  addBullet("Välj en mall för din projekttyp (t.ex. badrumsrenovering)");
  addBullet("Beskriv mängder med röst eller text");
  addBullet("AI beräknar timmar och kostnader");
  addBullet("Justera påslag och exportera som professionell PDF");
  y += 6;

  // New page for more content
  doc.addPage();
  y = margin;

  // === PLANERING ===
  addSectionHeader("📅 Planering & Tidslinje");
  addParagraph(
    "Skapa visuella tidsplaner för dina projekt. Beskriv projektets faser, så genererar AI en Gantt-tidslinje som du kan exportera och dela med ditt team."
  );
  addBullet("Beskriv projektets faser och tidsramar");
  addBullet("AI skapar en visuell tidslinje");
  addBullet("Redigera och justera efter behov");
  addBullet("Exportera som PDF för att dela med teamet");
  y += 6;

  // === KUNDHANTERING ===
  addSectionHeader("👥 Kundhantering");
  addParagraph(
    "Samla all kundinformation på ett ställe. Lägg till kontaktuppgifter, adresser och anteckningar för att hålla ordning på dina kundrelationer."
  );
  addBullet("Spara kontaktuppgifter och organisationsnummer");
  addBullet("Koppla kunder till projekt automatiskt");
  addBullet("Anteckningar och historik per kund");
  y += 6;

  // === TIPS ===
  addSectionHeader("💡 Tips för bästa resultat");
  addBullet("Använd röstinspelning – snabbaste sättet att dokumentera från fältet");
  addBullet("Granska AI-genererat innehåll innan du sparar eller skickar");
  addBullet("Skapa egna mallar för arbetsmoment du ofta återkommer till");
  addBullet("Dokumentera ÄTA direkt – det sparar tid vid fakturering");
  addBullet("Exportera viktiga dokument som PDF för säker arkivering");
  y += 10;

  // === FAQ ===
  addSectionHeader("❓ Vanliga frågor");
  
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PDF_COLORS.DARK);
  doc.text("Kan jag använda Byggio på mobilen?", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...PDF_COLORS.MUTED);
  const mobileAnswer = doc.splitTextToSize(
    "Ja! Byggio är optimerat för mobil användning. Du kan enkelt dokumentera arbete direkt från byggplatsen.",
    contentWidth
  );
  doc.text(mobileAnswer, margin, y);
  y += mobileAnswer.length * 5 + 8;

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PDF_COLORS.DARK);
  doc.text("Hur fungerar AI-funktionerna?", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...PDF_COLORS.MUTED);
  const aiAnswer = doc.splitTextToSize(
    "AI hjälper dig att strukturera information automatiskt. Du kan alltid redigera resultatet innan du sparar.",
    contentWidth
  );
  doc.text(aiAnswer, margin, y);
  y += aiAnswer.length * 5 + 8;

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PDF_COLORS.DARK);
  doc.text("Kan jag exportera mina dokument?", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...PDF_COLORS.MUTED);
  const exportAnswer = doc.splitTextToSize(
    "Ja, alla dokument kan exporteras som professionella PDF-filer med din företagslogga.",
    contentWidth
  );
  doc.text(exportAnswer, margin, y);
  y += exportAnswer.length * 5 + 8;

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(...PDF_COLORS.MUTED);
    doc.text("Byggio – Byggprojekt, enkelt och digitalt", margin, pageHeight - 10);
    doc.text(`Sida ${i} av ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: "right" });
  }

  // Save
  doc.save("byggio-guide.pdf");
}
