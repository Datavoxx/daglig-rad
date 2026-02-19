

## Fix: Visa bilder i Oversikts-PDF + fixa ekonomi i Summerings-PDF

### Problem 1: Projektfiler visar bara text i Oversikts-PDF

Oversikts-PDF:en (`generateProjectPdf.ts`) visar filer som en enkel tabell med filnamn, kategori, storlek och datum. Den borde visa bildfiler som inbaddade bilder -- precis som Summerings-PDF:en redan gor.

**Orsak:** `ProjectFile`-interfacet i Oversikts-PDF:en saknar `storage_path` som behovs for att hamta bilden fran lagringen.

### Problem 2: Ekonomisk sammanfattning i Summerings-PDF ar felaktig

Summerings-PDF:en (`generateCompleteProjectPdf.ts`) har tva problem:

1. **Saknar arbetskostnad** -- den raknar bara leverantorsfakturor som kostnader, men appens dashboard (`EconomicOverviewCard`) inkluderar aven arbetskostnad (timmar x debiteringsrate). Darfor blir "Bruttoresultat" for hogt.

2. **Unicode-bugg** -- `formatCurrency` anvander `Intl.NumberFormat("sv-SE")` som producerar Unicode-tecken som jsPDF inte kan rendera korrekt (samma bugg som vi fixade i Oversikts-PDF:en).

### Losning

**Fil 1: `src/lib/generateProjectPdf.ts`**

- Lagg till `storage_path` i `ProjectFile`-interfacet
- Gor `generateProjectPdf` till en `async`-funktion (behovs for `fetch`)
- Lagg till `fetchImageAsBase64` och `isImageFile` hjalpfunktioner (samma som finns i `generateCompleteProjectPdf.ts`)
- Skriv om `renderFilesPage` till att:
  - Separera bildfiler fran ovriga filer
  - Hamta och badda in bilder med `doc.addImage()`
  - Visa ovriga filer i en tabell

**Fil 2: `src/lib/generateCompleteProjectPdf.ts`**

- Byt ut `Intl.NumberFormat("sv-SE")` i `formatCurrency` mot en ASCII-saker formateringsfunktion (samma `safeFormatNumber`-logik)
- Lagg till arbetskostnad i ekonomisk sammanfattning:
  - Utoka `TimeEntry`-interfacet med `billing_rate` (eller hamta billing_types)
  - Berakna `laborCost = timmar x debiteringsrate`
  - Visa separat rad for "Arbetskostnad"
  - Uppdatera "Bruttoresultat" att inkludera bade leverantorskostnader och arbetskostnad

**Fil 3: `src/pages/ProjectView.tsx`**

- I `handleSummaryPdf`: Utoka `time_entries`-queryn med `billing_type_name` och join till `billing_types(hourly_rate)` sa att arbetskostnaden kan beraknas korrekt

### Filandringar

| Fil | Andring |
|-----|---------|
| `src/lib/generateProjectPdf.ts` | Lagg till `storage_path` i interface, lagg till `fetchImageAsBase64`/`isImageFile`, skriv om `renderFilesPage` till att badda in bilder, gor den async |
| `src/lib/generateCompleteProjectPdf.ts` | Byt `Intl.NumberFormat` mot ASCII-saker formatering, lagg till arbetskostnad i ekonomisk sammanfattning |
| `src/pages/ProjectView.tsx` | Utoka time_entries-query i `handleSummaryPdf` med billing rate |

