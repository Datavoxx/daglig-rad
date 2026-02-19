

## Utoka Oversikts-PDF med alla projektflikar + fixa cirkeldiagram

### Problem

1. **Cirkeldiagrammet syns inte** -- det renderas bara om en offert ar kopplad (`quoteValue > 0`). Diagrammet ska alltid visas med de data som finns (utgifter + ATA), aven utan offert.

2. **PDF:en saknar sektioner** -- den visar bara KPI-dashboard och dagrapporter. Alla projektflikar ska finnas med:
   - ATA-arbeten (detaljerad tabell med nummer, beskrivning, belopp, status)
   - Arbetsorder (tabell med titel, tilldelad, forfallodag, status)
   - Planering (faser med veckor och beskrivningar)
   - Dagbok/Dagrapporter (redan finns, behaller)
   - Filer (lista over uppladdade filer med namn, kategori, storlek)

### Andringar

**Fil 1: `src/pages/ProjectView.tsx`** (handleOverviewPdf)

Utoka datahamtningen med:
- `project_ata` -- hamta alla falt (inte bara subtotal/status)
- `project_work_orders` -- alla arbetsorder
- `project_plans` -- planering med faser
- `project_files` -- fillistning

Skicka med alla dessa som nya falt i `ProjectReport`-objektet.

**Fil 2: `src/lib/generateProjectPdf.ts`**

1. **Utoka `ProjectReport`-interfacet** med:
   - `ataItems` -- array med ATA-detaljer (nummer, beskrivning, artikel, antal, enhet, a-pris, subtotal, status)
   - `workOrders` -- array med arbetsorder (titel, beskrivning, tilldelad, forfallodag, status)
   - `plan` -- planeringsobjekt med faser
   - `projectFiles` -- array med filer (namn, kategori, storlek, datum)

2. **Fixa cirkeldiagrammet** -- ta bort villkoret `if (hasQuote)`. Visa alltid diagrammet med de segment som har data (utgifter, ATA, och marginal om offert finns). Om bara utgifter och ATA finns, visa dessa tva.

3. **Lagg till nya render-funktioner**:
   - `renderAtaPage()` -- tabell med alla ATA-poster (nr, beskrivning, antal, a-pris, summa, status) med fargkodad status
   - `renderWorkOrdersPage()` -- tabell med arbetsorder (nummer, titel, tilldelad, forfallodatum, status)
   - `renderPlanningPage()` -- lista over planeringsfaser med namn, veckor och beskrivning
   - `renderFilesPage()` -- tabell med alla filer (namn, kategori, storlek, uppladdningsdatum)

4. **Uppdatera huvudfunktionen** -- rendera sidorna i ordning:
   - Sida 1: Forsattssida
   - Sida 2: KPI Dashboard + cirkeldiagram
   - Sida 3: ATA-arbeten (om finns)
   - Sida 4: Arbetsorder (om finns)
   - Sida 5: Planering (om finns)
   - Sida 6+: Dagbok/Dagrapporter (om finns)
   - Sista: Fillista (om finns)

### Visuell design

Varje ny sektion foljer samma designsprak:
- Gron rubrik med avskiljarlinje
- `autoTable` med gront tabellhuvud
- Konsekvent typografi och farger
- Fargkodade statusbadgar (gron = godkand/klar, gul = pagaende, rod = avvisad)

### Filandringar

| Fil | Andring |
|-----|---------|
| `src/lib/generateProjectPdf.ts` | Ta bort hasQuote-villkor for donut, lagg till renderAtaPage, renderWorkOrdersPage, renderPlanningPage, renderFilesPage, utoka interface |
| `src/pages/ProjectView.tsx` | Hamta ATA (alla falt), arbetsorder, planering, filer och skicka till generateProjectPdf |

