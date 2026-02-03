

## Plan: Grön PDF-header + Obligatoriskt projekt i uppladdningsdialog

### Problem 1: Blå header istället för Byggios gröna färg
PDF:en använder `BYGGIO_BLUE` (blue-600, `#2563EB`) som header-färg, men Byggios varumärkesfärg är **grön** som syns i loggan.

### Problem 2: Projektvalidering saknas i uppladdningsdialogen
Valideringen vi tidigare implementerade finns i `VendorInvoiceDialog.tsx` (redigera faktura), men du testar `VendorInvoiceUpload.tsx` (lägg till ny faktura) - där saknas projektvalidering helt.

---

## Lösning

### Fil 1: `src/lib/pdfUtils.ts`

Byt ut `BYGGIO_BLUE` mot en grön färg som matchar Byggios varumärke:

| Före | Efter |
|------|-------|
| `BYGGIO_BLUE: [37, 99, 235]` (blue-600) | `BYGGIO_GREEN: [34, 197, 94]` (green-500) |
| `HEADER_BG: [37, 99, 235]` | `HEADER_BG: [34, 197, 94]` |

**Ändringar:**
```typescript
// Byt ut blå mot grön
HEADER_BG: [34, 197, 94] as [number, number, number],  // green-500 - BYGGIO GREEN
BYGGIO_GREEN: [34, 197, 94] as [number, number, number], // green-500 - Primary brand color
```

### Fil 2: `src/lib/generatePlanningPdf.ts`

Uppdatera referensen från `BYGGIO_BLUE` till `BYGGIO_GREEN`:

```typescript
// Rad 106: Ändra från
doc.setFillColor(...PDF_COLORS.BYGGIO_BLUE);

// Till
doc.setFillColor(...PDF_COLORS.BYGGIO_GREEN);
```

---

### Fil 3: `src/components/invoices/VendorInvoiceUpload.tsx`

Lägg till samma projektvalidering som i `VendorInvoiceDialog`:

1. **Lägg till error-state:**
```typescript
const [projectError, setProjectError] = useState(false);
```

2. **Uppdatera projektlabel med asterisk:**
```tsx
<Label>Projekt *</Label>
```

3. **Lägg till visuell felindikation på Select:**
```tsx
<Select value={projectId} onValueChange={(v) => { setProjectId(v); setProjectError(false); }}>
  <SelectTrigger className={projectError ? "border-destructive" : ""}>
    <SelectValue placeholder="Välj projekt" />
  </SelectTrigger>
  ...
</Select>
{projectError && (
  <p className="text-xs text-destructive">Projekt måste väljas</p>
)}
```

4. **Validera innan spara:**
Ändra sparaknappens onClick till att validera projekt först:
```tsx
onClick={() => {
  if (!projectId) {
    setProjectError(true);
    toast.error("Du måste välja ett projekt");
    return;
  }
  saveMutation.mutate();
}}
```

5. **Uppdatera disabled-villkoret:**
Ta bort `!supplierName` (det är sekundärt) men behåll resten.

6. **Uppdatera resetForm:**
Lägg till `setProjectError(false)` i reset-funktionen.

---

## Resultat

| Ändring | Fil |
|---------|-----|
| Byt header-färg till grön | `pdfUtils.ts` |
| Uppdatera färgreferens | `generatePlanningPdf.ts` |
| Lägg till projektvalidering | `VendorInvoiceUpload.tsx` |

### Visuellt resultat

**PDF Header:**
- Före: Blå accent-linje högst upp
- Efter: Grön accent-linje som matchar Byggio-loggan

**Leverantörsfaktura (lägg till):**
- Före: Kan spara utan projekt valt
- Efter: Rött felmeddelande + blockerar sparning om projekt saknas

