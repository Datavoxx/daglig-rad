

## Fix: Korrupt text i PDF + marginalberakning

### Problem 1: Korrupt text pa "Beraknad marginal"-raden

Raden visar `"&&4& &0&0&0& &k&r& &"` istallet for t.ex. "-4 000 kr (0%)".

**Orsak:** `toLocaleString("sv-SE")` producerar Unicode-tecken som jsPDF inte kan rendera med standardfonten:
- Unicode-minustecken (U+2212) istallet for vanligt bindestreck
- Non-breaking space (U+00A0) som tusentalsavgransare

### Problem 2: Marginal visar 0% nar offert saknas

Nar offertvardet ar 0 kr och utgifterna ar 4 000 kr borde marginalen inte visa 0% -- den borde antingen visa "Ingen offert kopplad" eller ett negativt varde.

### Losning

**Fil: `src/lib/generateProjectPdf.ts`**

1. **Fixa toLocaleString-problemet:** Byt ut `toLocaleString("sv-SE")` i alla PDF-stallen mot en saker `formatCurrency`-funktion som bara anvander ASCII-tecken (vanligt bindestreck, vanligt mellanslag). Den befintliga `formatCurrency`-hjalpfunktionen anvander redan `toFixed()` som ar sakert -- utoka den eller skapa en ny `safeFormatNumber`-funktion.

2. **Fixa marginberakningen:** Om `quoteValue` ar 0, visa "Ej kopplad" eller liknande istallet for 0%.

### Tekniska andringar

Ersatt alla `toLocaleString("sv-SE")` i PDF-generatorn med en ASCII-saker formateringsfunktion:

```typescript
function safeFormatNumber(value: number): string {
  const isNegative = value < 0;
  const abs = Math.abs(value);
  const formatted = abs.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return isNegative ? `-${formatted}` : formatted;
}
```

Uppdatera marginal-raden:
- Om `quoteValue === 0`: Visa "Ingen offert kopplad" i marginal-KPI:n och tabellen
- Om `quoteValue > 0`: Berakna och visa korrekt

### Filandringar

| Fil | Andring |
|-----|---------|
| `src/lib/generateProjectPdf.ts` | Lagg till `safeFormatNumber`, ersatt alla `toLocaleString("sv-SE")` i tabellen, fixa marginal-logik for 0-offert |

