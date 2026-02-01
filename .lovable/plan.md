

## Förbättra Faktura-PDF Footer

### Problem

Nuvarande footer har:
1. **Trång kolumn 3** - Bankgiro, Momsreg.nr och Org.nr är staplade på varandra
2. **E-post syns dåligt** - Gömd under telefonnummer i kolumn 2
3. **Inkonsekvent layout** - Rubriker och värden blandas på ett förvirrande sätt

### Lösning

Omorganisera footern till en mer lättläst 2-rads layout med tydliga sektioner:

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│ Postadress          Kontakt              Betalning           Organisaton   │
│ ─────────────────────────────────────────────────────────────────────────  │
│ JIAAB               Tel: 0707747731      Bankgiro: 142-7137  Org.nr:       │
│ Gatan 1             E-post:              Momsreg.nr:         5594161894    │
│ 123 45 Stad         mmagenzy.info@...    SE559416189401      F-skatt: Ja   │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Tekniska ändringar

| Fil | Ändring |
|-----|---------|
| `src/lib/generateCustomerInvoicePdf.ts` | Uppdatera `drawFooter()` med ny 4-kolumn layout |

### Ny footerstruktur

**Kolumn 1: Postadress**
- Företagsnamn
- Gatuadress
- Postnummer + Ort

**Kolumn 2: Kontakt**
- Telefon med "Tel:"-prefix
- E-post med "E-post:"-prefix

**Kolumn 3: Betalning**
- Bankgiro med label
- Momsreg.nr med label

**Kolumn 4: Organisation**
- Org.nr med label
- F-skatt-status

### Kodjustering

```typescript
const drawFooter = () => {
  const footerY = pageHeight - 28; // Lite mer utrymme
  
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY, pageWidth - margin, footerY);
  
  const colWidth = (pageWidth - margin * 2) / 4;
  let y = footerY + 5;
  
  // Kolumnrubriker
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "bold");
  doc.text("Postadress", margin, y);
  doc.text("Kontakt", margin + colWidth, y);
  doc.text("Betalning", margin + colWidth * 2, y);
  doc.text("Organisation", margin + colWidth * 3, y);
  
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(60, 60, 60);
  
  // Kolumn 1: Postadress
  doc.text(company?.company_name || "–", margin, y);
  doc.text(company?.address || "–", margin, y + 3.5);
  const postalLine = `${company?.postal_code || ""} ${company?.city || ""}`.trim();
  doc.text(postalLine || "–", margin, y + 7);
  
  // Kolumn 2: Kontakt (med tydliga labels)
  doc.text(`Tel: ${company?.phone || "–"}`, margin + colWidth, y);
  doc.text(`E-post: ${company?.email || "–"}`, margin + colWidth, y + 3.5);
  
  // Kolumn 3: Betalning
  doc.text(`Bankgiro: ${company?.bankgiro || "–"}`, margin + colWidth * 2, y);
  doc.text(`Momsreg.nr: ${company?.momsregnr || "–"}`, margin + colWidth * 2, y + 3.5);
  
  // Kolumn 4: Organisation
  doc.text(`Org.nr: ${company?.org_number || "–"}`, margin + colWidth * 3, y);
  doc.text(`F-skatt: ${company?.f_skatt !== false ? "Ja" : "Nej"}`, margin + colWidth * 3, y + 3.5);
};
```

### Förbättringar

- ✅ **E-post tydligt synlig** med "E-post:"-prefix
- ✅ **Konsekvent layout** - alla kolumner har samma struktur
- ✅ **Mindre trångt** - max 2-3 rader per kolumn
- ✅ **Bättre rubriker** - "Kontakt", "Betalning", "Organisation" istället för att lista värdenamn
- ✅ **Alla värden har labels** - lättare att förstå vad som är vad

