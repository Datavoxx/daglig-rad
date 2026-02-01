

## Åtgärdsplan: Juridiskt Korrekt Kundfaktura-PDF

### Problemanalys

ChatGPT:s granskning identifierade att faktura-PDF:en saknar obligatoriska uppgifter enligt svenska bokföringsregler:

| Saknas | Krav enligt Skatteverket |
|--------|--------------------------|
| Säljarens namn & adress | Obligatoriskt |
| Organisationsnummer | Obligatoriskt |
| Momsregistreringsnummer | Obligatoriskt för momsregistrerade |
| Bankgiro/betaluppgifter | Nödvändigt för betalning |
| F-skatt-status | Branschstandard |

### Lösning

Återanvänd footer-mönstret från `generateQuotePdf.ts` (rad 94-143) som redan har alla dessa uppgifter i en professionell layout.

### Ändringar i generateCustomerInvoicePdf.ts

#### 1. Lägg till footer-funktion (ny kod)

```typescript
const drawFooter = () => {
  const footerY = pageHeight - 25;
  
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY, pageWidth - margin, footerY);
  
  const colWidth = (pageWidth - margin * 2) / 4;
  let y = footerY + 5;
  
  // Rubriker
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
  
  // Postadress (kolumn 1)
  doc.text(company?.company_name || "–", margin, y);
  doc.text(company?.address || "–", margin, y + 3);
  doc.text(`${company?.postal_code || ""} ${company?.city || ""}`.trim() || "–", margin, y + 6);
  
  // Telefon (kolumn 2)
  doc.text(company?.phone || "–", margin + colWidth, y);
  if (company?.email) {
    doc.text(company.email, margin + colWidth, y + 3);
  }
  
  // Bankgiro + Momsreg (kolumn 3)
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
  
  // F-skatt (kolumn 4)
  doc.text(company?.f_skatt !== false ? "Ja" : "Nej", margin + colWidth * 3, y);
};
```

#### 2. Anropa footer i slutet av PDF:en

```typescript
// Före doc.save():
drawFooter();
```

#### 3. Justera betalningssektionen

Flytta betalinformationen högre upp och gör den tydligare:

```typescript
// Betalningsinformation (förbättrad)
yPos += 20;
doc.setFontSize(10);
doc.setFont("helvetica", "bold");
doc.setTextColor(0, 0, 0);
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
```

### Sammanfattning

| Fil | Ändring |
|-----|---------|
| `src/lib/generateCustomerInvoicePdf.ts` | Lägg till `drawFooter()`-funktion med företagsinfo |
| `src/lib/generateCustomerInvoicePdf.ts` | Anropa `drawFooter()` före `doc.save()` |
| `src/lib/generateCustomerInvoicePdf.ts` | Förbättra betalningssektionen med tydligare layout |

### Resultat efter fix

Fakturan kommer innehålla:

```text
┌────────────────────────────────────────────────────────────┐
│ [LOGO]                                    FAKTURA          │
│                                           Nr: INV-2026-0001│
│ ─────────────────────────────────────────────────────────  │
│ VÅR REFERENS              KUND                             │
│ Anna Andersson            Kund AB                          │
│ ...                                                        │
│ ─────────────────────────────────────────────────────────  │
│ Projekt: Badrumsrenovering                                 │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Beskrivning    │ Antal │ Enhet │ Á-pris │ Summa     │   │
│ │ ...            │       │       │        │           │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                            │
│                          Summa exkl. moms    35 800 kr     │
│                          Moms 25%             8 950 kr     │
│                          ─────────────────────────────     │
│                          ATT BETALA          44 750 kr     │
│                                                            │
│ Betalningsinformation                                      │
│ Bankgiro: 123-4567                                         │
│ Betalvillkor: 30 dagar netto                               │
│ OCR/Referens: INV-2026-0001                                │
│                                                            │
│ ═══════════════════════════════════════════════════════    │
│ Postadress     │ Telefon      │ Bankgiro    │ F-skatt     │
│ AB Byggaren    │ 070-123 45 67│ 123-4567    │ Ja          │
│ Storgatan 1    │              │ Momsreg.nr  │             │
│ 123 45 Stad    │              │ SE55941...  │             │
│                │              │ Org.nr      │             │
│                │              │ 556677-8899 │             │
└────────────────────────────────────────────────────────────┘
```

### Validering

Efter implementationen kommer fakturan uppfylla:
- ✅ Skatteverkets krav på fakturor
- ✅ Samma professionella standard som offert-PDF:en
- ✅ All info kunden behöver för att betala

