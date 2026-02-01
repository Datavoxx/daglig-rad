

## Fix: Åtgärda överlappning mellan Betalningsinformation och Footer

### Problem

Som bilden visar överlappar "OCR/Referens" med footer-kolumnerna (Postadress, Kontakt, etc.). Det saknas tydlig separation och footern är för nära betalningsinformationen.

### Lösning

1. **Ta bort duplicerad information** - Betalningssektionen visar bankgiro som redan finns i footern
2. **Flytta footern längre ner** - Ge mer utrymme mellan innehåll och footer
3. **Lägg till tydlig separator-linje** ovanför footern

### Ändringar

| Fil | Ändring |
|-----|---------|
| `src/lib/generateCustomerInvoicePdf.ts` | Ta bort betalningssektionen och förbättra footerns position |

### Ny struktur

```text
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│ [Faktura-innehåll]                                             │
│                                                                │
│                     Summa exkl. moms        xxx kr             │
│                     Moms 25%                xxx kr             │
│                     ┌────────────────────────────┐             │
│                     │ ATT BETALA        xxx kr   │             │
│                     └────────────────────────────┘             │
│                                                                │
│ Betalvillkor: 30 dagar netto                                   │
│ OCR/Referens: INV-2026-0001                                    │
│                                                                │
│ ═══════════════════════════════════════════════════════════    │  <-- Tydlig separator
│                                                                │
│ Postadress     │ Kontakt           │ Betalning     │ Org       │
│ JIAAB          │ Tel: 0707...      │ Bankgiro:     │ Org.nr:   │
│ –              │ E-post: mma...    │ 142-7137      │ 5594...   │
│ –              │                   │ Momsreg.nr:   │ F-skatt:  │
│                │                   │ SE559...      │ Ja        │
└────────────────────────────────────────────────────────────────┘
```

### Kodjusteringar

**1. Ta bort duplicerad bankgiro från betalningssektionen**

```typescript
// Payment info - simplified (bankgiro is now in footer)
yPos += 30;
doc.setFontSize(9);
doc.setFont("helvetica", "normal");
doc.setTextColor(50, 50, 50);
doc.text(`Betalvillkor: ${invoice.payment_terms || "30 dagar netto"}`, margin, yPos);
yPos += 5;
doc.text(`OCR/Referens: ${invoice.invoice_number}`, margin, yPos);
```

**2. Flytta footern längre ner och lägg till mer avstånd**

```typescript
const drawFooter = () => {
  const footerY = pageHeight - 22; // Flyttad närmare botten (var 28)
  
  // Separator line above footer
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY, pageWidth - margin, footerY);
  
  const colWidth = (pageWidth - margin * 2) / 4;
  let y = footerY + 4;
  
  // ... resten av footern
};
```

### Resultat

- ✅ Ingen överlappning mellan betalningsinfo och footer
- ✅ Bankgiro visas endast en gång (i footern)
- ✅ Tydlig visuell separation med linje
- ✅ Footer placerad längre ner för mer utrymme

