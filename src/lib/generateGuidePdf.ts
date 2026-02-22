import jsPDF from "jspdf";
import { PDF_COLORS } from "./pdfUtils";
import byggioLogo from "@/assets/byggio-logo.png";

// Byggio brand colors
const BYGGIO_COLORS = {
  GREEN_DARK: [22, 101, 52] as [number, number, number],
  GREEN_PRIMARY: [21, 128, 61] as [number, number, number],
  GREEN_LIGHT: [34, 197, 94] as [number, number, number],
};

async function getByggioLogoBase64(): Promise<string | null> {
  try {
    const response = await fetch(byggioLogo);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error fetching Byggio logo:", error);
    return null;
  }
}

export async function generateGuidePdf() {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const checkPageBreak = (height: number) => {
    if (y + height > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const addSectionHeader = (text: string) => {
    checkPageBreak(20);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BYGGIO_COLORS.GREEN_PRIMARY);
    doc.text(text, margin, y);
    y += 8;
    doc.setTextColor(...PDF_COLORS.DARK);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
  };

  const addParagraph = (text: string) => {
    const lines = doc.splitTextToSize(text, contentWidth);
    checkPageBreak(lines.length * 5);
    doc.setTextColor(...PDF_COLORS.DARK);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 4;
  };

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
  doc.setFillColor(...BYGGIO_COLORS.GREEN_PRIMARY);
  doc.rect(0, 0, pageWidth, 6, "F");

  y = 16;
  const byggioLogoBase64 = await getByggioLogoBase64();
  if (byggioLogoBase64) {
    try {
      doc.addImage(byggioLogoBase64, "PNG", margin, y, 35, 12, undefined, "FAST");
    } catch (e) {
      console.error("Error adding Byggio logo:", e);
    }
  }

  y = 50;
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BYGGIO_COLORS.GREEN_DARK);
  doc.text("BYGGIO GUIDE", margin, y);

  y += 10;
  doc.setFontSize(12);
  doc.setTextColor(...PDF_COLORS.MUTED);
  doc.setFont("helvetica", "normal");
  doc.text("Din kompletta guide till effektiv projekthantering", margin, y);

  y += 12;
  doc.setDrawColor(...PDF_COLORS.MUTED);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 12;

  // === SNABBSTART ===
  addSectionHeader("SNABBSTART");
  addParagraph("Kom ig\u00e5ng med Byggio p\u00e5 bara tre enkla steg:");
  addBullet("Steg 1: Skapa en offert \u2013 Anv\u00e4nd mallar eller bygg fr\u00e5n grunden med AI-st\u00f6d");
  addBullet("Steg 2: Konvertera till projekt \u2013 N\u00e4r offerten godk\u00e4nns, g\u00f6r den till ett aktivt projekt");
  addBullet("Steg 3: Dokumentera arbetet \u2013 Anv\u00e4nd arbetsdagboken f\u00f6r att logga allt som h\u00e4nder");
  y += 4;

  // === PROJEKT ===
  addSectionHeader("PROJEKT \u2013 HELA ARBETSFL\u00d6DET");
  addParagraph(
    "Projekt \u00e4r hj\u00e4rtat i Byggio. H\u00e4r samlas all information om dina aktiva jobb \u2013 fr\u00e5n offert till slutbesiktning. Allt du beh\u00f6ver finns samlat i projektets flikar."
  );
  addBullet("Arbetsdagbok \u2013 Spela in dagrapporter direkt fr\u00e5n byggplatsen");
  addBullet("Planering & Tidslinje \u2013 Skapa visuella Gantt-tidslinjer f\u00f6r projektet");
  addBullet("\u00c4TA-hantering \u2013 Dokumentera och sp\u00e5ra alla \u00e4ndringsarbeten");
  addBullet("Arbetsorder & Filer \u2013 Skapa order och hantera projektdokument");
  y += 4;

  // === OFFERTER ===
  addSectionHeader("OFFERTER & KALKYLER");
  addParagraph(
    "Skapa detaljerade offerter snabbt med hj\u00e4lp av mallar och AI. Beskriv arbetet s\u00e5 ber\u00e4knas tid och kostnad automatiskt baserat p\u00e5 dina timpriser och materialpriser."
  );
  addBullet("V\u00e4lj en mall f\u00f6r din projekttyp (t.ex. badrumsrenovering)");
  addBullet("Beskriv m\u00e4ngder med r\u00f6st eller text");
  addBullet("AI ber\u00e4knar timmar och kostnader");
  addBullet("Justera p\u00e5slag och exportera som professionell PDF");
  y += 4;

  // === TIDSRAPPORTERING ===
  addSectionHeader("TIDSRAPPORTERING");
  addParagraph(
    "Rapportera arbetstid per projekt och anst\u00e4lld. M\u00e5nads- och veckovyer, attestering och periodhantering."
  );
  addBullet("Kalendervyer \u2013 M\u00e5nads- och vecko\u00f6versikt");
  addBullet("Tidsregistrering per projekt \u2013 Koppla tid till r\u00e4tt projekt");
  addBullet("Attestering \u2013 Godk\u00e4nn tidposter");
  addBullet("Periodl\u00e5sning \u2013 L\u00e5s avslutade perioder");
  y += 4;

  // New page
  doc.addPage();
  y = margin;

  // === DAGRAPPORTER ===
  addSectionHeader("DAGRAPPORTER");
  addParagraph(
    "Dokumentera arbetsdagen med r\u00f6stinspelning. AI strukturerar rapporten automatiskt med arbetsmoment, personal och avvikelser."
  );
  addBullet("R\u00f6stinspelning fr\u00e5n f\u00e4ltet \u2013 Spela in direkt p\u00e5 byggplatsen");
  addBullet("AI-strukturerad dokumentation \u2013 Automatisk kategorisering");
  addBullet("Koppla till projekt \u2013 Samla rapporter per projekt");
  addBullet("Exportera som PDF \u2013 Professionell dokumentation");
  y += 4;

  // === PERSONALLIGGARE ===
  addSectionHeader("PERSONALLIGGARE / N\u00c4RVARO");
  addParagraph(
    "Digital personalliggare med QR-kodincheckning. Se vilka som \u00e4r p\u00e5 plats i realtid."
  );
  addBullet("QR-kodscanning \u2013 Snabb in- och utcheckning");
  addBullet("Realtids\u00f6versikt \u2013 Se aktiva p\u00e5 plats just nu");
  addBullet("N\u00e4rvarohistorik \u2013 Fullst\u00e4ndig logg");
  addBullet("Skatteverks-kompatibel \u2013 Uppfyller lagkrav");
  y += 4;

  // === FAKTUROR ===
  addSectionHeader("FAKTUROR");
  addParagraph(
    "Hantera kund- och leverant\u00f6rsfakturor. Skapa fakturor, scanna kvitton och exportera."
  );
  addBullet("Kundfakturor \u2013 Skapa och skicka fakturor");
  addBullet("Leverant\u00f6rsfakturor \u2013 Registrera inkommande fakturor");
  addBullet("Kvittoscanning \u2013 Fotografera och spara kvitton");
  addBullet("PDF-export \u2013 Professionella faktura-PDF:er");
  y += 4;

  // === KUNDHANTERING ===
  addSectionHeader("KUNDHANTERING");
  addParagraph(
    "Samla all kundinformation p\u00e5 ett st\u00e4lle. L\u00e4gg till kontaktuppgifter, adresser och anteckningar f\u00f6r att h\u00e5lla ordning p\u00e5 dina kundrelationer."
  );
  addBullet("Spara kontaktuppgifter och organisationsnummer");
  addBullet("Koppla kunder till projekt automatiskt");
  addBullet("Anteckningar och historik per kund");
  y += 4;

  // === AI-ASSISTENTEN ===
  addSectionHeader("AI-ASSISTENTEN (BYGGIO AI)");
  addParagraph(
    "Fr\u00e5ga Byggio AI vad som helst. Skapa projekt, offerter, tidrapporter och mer med r\u00f6st eller text."
  );
  addBullet("R\u00f6ststyrning \u2013 Prata med AI:n");
  addBullet("Skapa poster via chat \u2013 Projekt, offerter, kunder m.m.");
  addBullet("S\u00f6k och analysera data \u2013 Hitta information snabbt");
  addBullet("Intelligent hj\u00e4lp \u2013 Kontextmedveten assistans");
  y += 4;

  // === TIPS ===
  addSectionHeader("TIPS F\u00d6R B\u00c4STA RESULTAT");
  addBullet("Anv\u00e4nd r\u00f6stinspelning \u2013 snabbaste s\u00e4ttet att dokumentera fr\u00e5n f\u00e4ltet");
  addBullet("Granska AI-genererat inneh\u00e5ll innan du sparar eller skickar");
  addBullet("Skapa egna mallar f\u00f6r arbetsmoment du ofta \u00e5terkommer till");
  addBullet("Dokumentera \u00c4TA direkt \u2013 det sparar tid vid fakturering");
  addBullet("Exportera viktiga dokument som PDF f\u00f6r s\u00e4ker arkivering");
  y += 8;

  // === FAQ ===
  addSectionHeader("VANLIGA FR\u00c5GOR");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...PDF_COLORS.DARK);
  doc.text("Kan jag anv\u00e4nda Byggio p\u00e5 mobilen?", margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...PDF_COLORS.MUTED);
  const mobileAnswer = doc.splitTextToSize(
    "Ja! Byggio \u00e4r optimerat f\u00f6r mobil anv\u00e4ndning. Du kan enkelt dokumentera arbete direkt fr\u00e5n byggplatsen.",
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
    "AI hj\u00e4lper dig att strukturera information automatiskt. Du kan alltid redigera resultatet innan du sparar.",
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
    "Ja, alla dokument kan exporteras som professionella PDF-filer med din f\u00f6retagslogga.",
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
    doc.text("Byggio \u2013 Byggprojekt, enkelt och digitalt", margin, pageHeight - 10);
    doc.text(`Sida ${i} av ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: "right" });
  }

  doc.save("byggio-guide.pdf");
}
