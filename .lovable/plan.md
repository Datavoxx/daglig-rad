

## Tre andringar i offertbyggaren

### 1. Lagg till Paslag-kolumn per offertrad (mellan A-pris och Summa)

Varje offertrad far ett nytt falt `markup_percent` (standard 0). I tabellhuvudet laggs en ny kolumn "Pasl%" mellan "A-pris" och "Summa". Anvandaren skriver in en procentsats per rad, och subtotalen raknas som `(antal * a-pris) * (1 + paslag/100)`.

Det hardkodade globala paslaget (15%) tas bort helt:
- `useEstimate.ts` rad 199: `|| 15` andras till `|| 0`
- Globala markup-berakningen i `calculateTotals` slopas (markup = 0 alltid, da paslaget nu ar per rad)
- `StickyTotals`: Paslags-raden doljs nar markup ar 0
- `EstimateTotals`: Paslags-sektionen doljs nar markup ar 0
- Forhandsgranskning och PDF: Ingen separat paslags-rad visas langre, paslaget ar redan inbakat i radernas summa

**Tekniska andringar:**

| Fil | Andring |
|-----|---------|
| `EstimateItem` interface i `EstimateTable.tsx` | Lagg till `markup_percent: number` |
| `EstimateTable.tsx` header och rader | Ny kolumn "Pasl%" (input, ca 50px) mellan A-pris och Summa. Grid-template uppdateras. |
| `EstimateTable.tsx` `updateItem` | Rakna subtotal med paslag: `base * (1 + markup_percent/100)` |
| `EstimateTable.tsx` `addItem` | Default `markup_percent: 0` |
| `useEstimate.ts` rad 199 | `\|\| 15` till `\|\| 0` |
| `useEstimate.ts` `calculateTotals` | `markup` sjalva slopas (alltid 0), paslaget ar inbakat i per-rad subtotal |
| `useEstimate.ts` sparfunktionen | Spara `markup_percent` per item |
| `useEstimate.ts` ladda befintlig | Ladda `markup_percent` fran sparad data |
| `StickyTotals.tsx` | Dolj "Pasl:" nar markup ar 0 |
| `EstimateTotals.tsx` | Dolj paslags-raden nar markupPercent ar 0 |
| DB migration | Lagg till kolumn `markup_percent numeric default 0` pa `estimate_items` |

### 2. Flytta Artiklar fran Installningar till Offert-sidan

Knappen "Artiklar" laggs bredvid "Importera" pa offertlistsidan (`Estimates.tsx`). Den oppnar `ArticleManager`-komponenten i en dialog/sheet.

| Fil | Andring |
|-----|---------|
| `src/pages/Estimates.tsx` | Lagg till en "Artiklar"-knapp bredvid Importera som oppnar en Sheet med `ArticleManager` |
| `src/pages/Settings.tsx` | Behall artikelfliken i installningar ocksa (eller ta bort -- beroende pa onskemal) |

### 3. Tidsplan: ta bort punktlistformat, gor till fritext

Punkterna ("bullet points") i forhandsgranskningen tas bort. Istallet renderas tidsplanen som ett enda textstycke med `whitespace-pre-wrap` sa att radbrytningar bevaras utan bullet-symboler.

| Fil | Andring |
|-----|---------|
| `QuoteLivePreview.tsx` rad 160-168 | Byt fran `<ul>/<li>` med bullet-punkt till `<p className="whitespace-pre-wrap">{assumptions.join("\n")}</p>` |
| `QuotePreviewSheet.tsx` rad 218-226 | Samma andring -- fritext istallet for lista |
| `generateQuotePdf.ts` | Uppdatera PDF-genereringen att inte anvanda bullet-format |

