

## Fyra andringar i offertbyggaren

### 1. Fixa antal-faltet sa man kan radera och skriva nytt

Antal-faltet i offerttabellen (desktop) anvander `type="text"` men konverterar till Number pa ett satt som kan bli konstigt. Andringar:

- **EstimateTable.tsx (desktop, rad ~582-599)**: Andra `value`-logiken sa att ett tomt falt verkligen visar tom strang, och att onChange hanterar tomma strang korrekt utan att aterstalla till 0.
- **EstimateTable.tsx (mobil, rad ~341-348)**: Samma fix for mobilversionen -- byt fran `type="number"` till `type="text"` med `inputMode="decimal"` for battre kontroll.

### 2. Ta bort hardkodad paslag-ruta fran summeringen

- **StickyTotals.tsx**: Ta bort visningen av "Pasl:" fran breakdownraden (desktop rad 120-123, mobil rad 59).
- **EstimateTotals.tsx**: Ta bort hela paslag-sektionen (rad 69-89) och behall bara subtotal, moms, och total. Denna komponent anvands inte aktivt i buildern men rensas for konsistens.
- **useEstimate.ts**: Satt `markupPercent` till 0 som default (redan 0 pa rad 55, men saker att det inte aterstalls till 15 fran befintliga offerter pa rad 199 -- andra fallback fran `|| 15` till `|| 0`).

### 3. Ny paslagspanel under skatteavdrag

Skapa en ny komponent `MarkupPanel.tsx` som placeras under TaxDeductionPanel i EstimateBuilder:

**Funktionalitet:**
- En switch "Paslag" for att aktivera/avaktivera
- Nar aktiverad visas alla offertrader i en lista
- Varje rad har en checkbox (valdbar) och ett procentfalt
- Paslaget beraknas per rad: `radSumma * (procent / 100)`
- Totalt paslag summeras och visas

**Datamodell:**
- Utoka `EstimateItem` med tva nya falt:
  - `markup_enabled: boolean` (default false)
  - `markup_percent: number` (default 0)
- Uppdatera `useEstimate.ts` totalberakning sa att `markup` summeras fran individuella raders paslag istallet for en global procent
- Uppdatera `StickyTotals` for att visa totalt paslag baserat pa per-rad-berakning

**Tekniska andringar:**

| Fil | Andring |
|-----|---------|
| `src/components/estimates/EstimateTable.tsx` | Lagg till `markup_enabled` och `markup_percent` i `EstimateItem`-interfacet |
| `src/components/estimates/MarkupPanel.tsx` | Ny komponent -- switch, radlista med checkboxar och procentfalt |
| `src/components/estimates/EstimateBuilder.tsx` | Importera och rendera MarkupPanel under TaxDeductionPanel, ta bort gammal markup-prop |
| `src/hooks/useEstimate.ts` | Andra `calculateTotals` sa markup beraknas per rad, ta bort `markupPercent` fran state (eller behall for bakatkompabilitet men anvand inte) |
| `src/components/estimates/StickyTotals.tsx` | Visa paslag fran ny berakning |
| `src/components/estimates/QuoteLivePreview.tsx` | Uppdatera paslag-visning |
| `src/components/estimates/QuotePreviewSheet.tsx` | Uppdatera paslag-visning |
| `src/lib/generateQuotePdf.ts` | Uppdatera PDF-generering for nya paslag |

### 4. Lagg till Artikelbibliotek-knapp pa offertlistan

Pa sidan `/estimates` (listvy) lagg till en knapp "Artikelbibliotek" bredvid "Importera"-knappen.

**Andring i `src/pages/Estimates.tsx`:**
- Rad 280-286: Lagg till en ny knapp med ikon `Package` mellan "Importera" och "Ny offert"
- Knappen oppnar antingen en dialog med artikelbiblioteket eller navigerar till installningar dar artiklar hanteras

Eftersom artikelbiblioteket i dag ar kopplat till en specifik offert (med `onAddArticles`-callback), och pa listsidan finns ingen aktiv offert, ar det mest logiskt att:
- Lata knappen navigera till Installningar -> Artikelhantering (`/settings` med ratt tab)
- Eller skapa en dialog som visar artikelbiblioteket for oversikt

Jag rekommenderar att knappen navigerar till artikelhanteringen i installningar, da det ger mest mening fran listsidan.

### Sammanfattning av filer som andras

1. `src/components/estimates/EstimateTable.tsx` -- fixa antal-input, lagg till markup-falt i interface
2. `src/components/estimates/MarkupPanel.tsx` -- ny komponent
3. `src/components/estimates/EstimateBuilder.tsx` -- integrera MarkupPanel, ta bort gammal markup
4. `src/hooks/useEstimate.ts` -- uppdatera totalberakning
5. `src/components/estimates/StickyTotals.tsx` -- uppdatera paslag-visning
6. `src/components/estimates/EstimateTotals.tsx` -- ta bort gammal paslag-sektion
7. `src/pages/Estimates.tsx` -- lagg till Artikelbibliotek-knapp
8. `src/components/estimates/QuoteLivePreview.tsx` -- uppdatera paslag
9. `src/components/estimates/QuotePreviewSheet.tsx` -- uppdatera paslag
10. `src/lib/generateQuotePdf.ts` -- uppdatera PDF
