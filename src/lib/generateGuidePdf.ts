import jsPDF from "jspdf";

export function generateGuidePdf() {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

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
    doc.setTextColor(34, 139, 87); // Primary green
    doc.text(text, margin, y);
    y += 10;
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
  };

  // Helper for body text
  const addParagraph = (text: string) => {
    const lines = doc.splitTextToSize(text, contentWidth);
    checkPageBreak(lines.length * 6);
    doc.text(lines, margin, y);
    y += lines.length * 6 + 4;
  };

  // Helper for bullet points
  const addBullet = (text: string) => {
    const bulletMargin = margin + 5;
    const bulletWidth = contentWidth - 5;
    const lines = doc.splitTextToSize(text, bulletWidth);
    checkPageBreak(lines.length * 6);
    doc.text("•", margin, y);
    doc.text(lines, bulletMargin, y);
    y += lines.length * 6 + 2;
  };

  // Title
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(34, 139, 87);
  doc.text("Byggio Guide", margin, y);
  y += 10;
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.text("En komplett guide till att använda Byggio", margin, y);
  y += 20;

  // Divider
  doc.setDrawColor(34, 139, 87);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 15;

  // Overview
  addSectionHeader("Översikt");
  addParagraph(
    "Byggio är en digital plattform för byggprojekt som hjälper dig att hantera dagrapporter, planering, egenkontroller och kalkyler. Allt på ett ställe, enkelt och digitalt."
  );
  y += 6;

  // Dagrapporter
  addSectionHeader("Dagrapporter");
  addParagraph(
    "Dagrapporter används för att dokumentera det dagliga arbetet på byggplatsen. Varje rapport innehåller information om bemanning, utfört arbete, avvikelser och material."
  );
  addBullet("Skapa nya rapporter med röstinspelning eller text");
  addBullet("AI hjälper till att strukturera informationen automatiskt");
  addBullet("Exportera rapporter som PDF för arkivering");
  addBullet("Håll koll på avvikelser och ÄTA");
  y += 6;

  // Planering
  addSectionHeader("Planering");
  addParagraph(
    "Planeringsfunktionen hjälper dig att skapa en grov tidsplan för ditt projekt. Beskriv projektets faser med röst eller text, så genererar AI en visuell Gantt-tidslinje."
  );
  addBullet("Beskriv projektets faser och tidsramar");
  addBullet("AI skapar en visuell tidslinje");
  addBullet("Redigera och justera faser enkelt");
  addBullet("Exportera planeringen som PDF");
  y += 6;

  // Egenkontroller
  addSectionHeader("Egenkontroller");
  addParagraph(
    "Egenkontroller säkerställer kvaliteten i byggprojektet. Använd färdiga mallar eller skapa egna för att systematiskt kontrollera att arbetet utförs enligt krav och standarder."
  );
  addBullet("Välj från färdiga kontrollmallar för olika arbetsmoment");
  addBullet("Markera kontrollpunkter som OK, avvikelse eller ej tillämplig");
  addBullet("Dokumentera avvikelser med kommentarer");
  addBullet("Exportera egenkontroller som PDF-protokoll");
  y += 6;

  // Offerter
  addSectionHeader("Offerter");
  addParagraph(
    "Offertfunktionen låter dig skapa detaljerade kostnadsberäkningar för dina projekt. Använd mallar med fördefinierade arbetsmoment och timpriser för att snabbt ta fram offerter."
  );
  addBullet("Skapa och spara egna offertmallar");
  addBullet("Beskriv mängder med röst eller text");
  addBullet("AI beräknar timmar och kostnader baserat på mallen");
  addBullet("Justera påslag och exportera som PDF");

  // New page for template example
  doc.addPage();
  y = margin;

  addSectionHeader("Exempelmall: Badrumsrenovering");
  addParagraph(
    "Nedan visas ett exempel på hur en kalkylmall för badrumsrenovering kan se ut. Mallen innehåller typiska arbetsmoment med timuppskattningar."
  );
  y += 4;

  // Table header
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, contentWidth, 8, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("WBS", margin + 2, y + 5.5);
  doc.text("Moment", margin + 20, y + 5.5);
  doc.text("Enhet", margin + 90, y + 5.5);
  doc.text("Tim/enh", margin + 115, y + 5.5);
  doc.text("Resurs", margin + 140, y + 5.5);
  y += 10;

  // Table rows
  const templateItems = [
    { wbs: "1.0", name: "Rivning av befintligt", unit: "m²", hours: 0.9, resource: "Snickare" },
    { wbs: "2.0", name: "Tätskikt golv", unit: "m²", hours: 0.7, resource: "Snickare" },
    { wbs: "2.1", name: "Tätskikt vägg", unit: "m²", hours: 0.6, resource: "Snickare" },
    { wbs: "3.0", name: "Plattsättning golv", unit: "m²", hours: 1.2, resource: "Plattsättare" },
    { wbs: "3.1", name: "Plattsättning vägg", unit: "m²", hours: 1.0, resource: "Plattsättare" },
    { wbs: "4.0", name: "VVS-installation", unit: "st", hours: 4.0, resource: "Rörmokare" },
    { wbs: "5.0", name: "El-installation", unit: "st", hours: 3.0, resource: "Elektriker" },
    { wbs: "6.0", name: "Fogning", unit: "m²", hours: 0.3, resource: "Plattsättare" },
    { wbs: "7.0", name: "Montering porslin", unit: "st", hours: 1.5, resource: "Rörmokare" },
    { wbs: "8.0", name: "Slutbesiktning", unit: "st", hours: 2.0, resource: "Projektledare" },
  ];

  doc.setFont("helvetica", "normal");
  templateItems.forEach((item, index) => {
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y - 3, contentWidth, 7, "F");
    }
    doc.text(item.wbs, margin + 2, y + 2);
    doc.text(item.name, margin + 20, y + 2);
    doc.text(item.unit, margin + 90, y + 2);
    doc.text(item.hours.toString(), margin + 115, y + 2);
    doc.text(item.resource, margin + 140, y + 2);
    y += 7;
  });

  y += 10;
  addParagraph(
    "Med denna mall behöver du bara ange mängderna (t.ex. '8 kvadrat golv, 20 kvadrat vägg'), så beräknar systemet automatiskt tidsåtgång och kostnad baserat på timpriserna i mallen."
  );

  // Tips section
  y += 6;
  addSectionHeader("Tips för bästa resultat");
  addBullet("Var specifik när du beskriver arbetsmoment och mängder");
  addBullet("Använd röstinspelning för snabbare inmatning");
  addBullet("Granska alltid AI-genererat innehåll innan du sparar");
  addBullet("Exportera viktiga dokument som PDF för arkivering");
  addBullet("Håll dina kalkylmallar uppdaterade med aktuella timpriser");

  // Footer
  y = pageHeight - 15;
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text("Byggio - Byggprojekt, enkelt och digitalt", margin, y);
  doc.text(new Date().toLocaleDateString("sv-SE"), pageWidth - margin - 20, y);

  // Save
  doc.save("byggio-guide.pdf");
}
