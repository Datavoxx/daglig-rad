

## Redesign: Projektinformation, Ekonomisk oversikt med cirkeldiagram och ny layout

### Sammanfattning
Tre huvudandringar i projektovesikten:
1. **Projektinformation** -- modernare design med snyggare layout (ikon-rad-baserad istallet for label+text-block)
2. **Ekonomisk oversikt** -- lagg till ett cirkeldiagram (donut chart) som visar fordelningen Offert vs Utgifter vs ATA, med befintliga textdetaljer (Utgifter, ATA, Beraknad marginal) under diagrammet. Behall OBS- och Tips-rutorna.
3. **Ekonomisk oversikt flyttas upp** -- den placeras direkt efter KPI-korten, ovanfor projektinformation. Planeringsstatus-sektionen ersatter Status-faltet i projektinformation.

### Detaljerad layout (ny ordning)

```text
[KPI-kort grid -- oforandrat]

[Ekonomisk oversikt (NY med donut chart)]   |   [Projektinformation (redesignad)]

[Planeringsstatus -- oforandrad]

[Tidsrapportering -- oforandrad]
```

### 1. Ekonomisk oversikt med cirkeldiagram

**Fil:** `src/components/projects/EconomicOverviewCard.tsx`

- Lagg till ett donut-chart (anvander `recharts` PieChart som redan ar installerat) overst i kortet
- Diagrammet visar tre segment: Offertbelopp, Utgifter, ATA (godkanda)
- Under diagrammet behalls befintlig text: Utgifter (collapsible), ATA (collapsible), Beraknad marginal, progress-bar
- OBS- och Tips-rutorna behalls langst ner

Cirkeldiagram-data:
- Offert (minus utgifter minus ATA) = kvarvarande marginal -- farg: gron
- Utgifter -- farg: rod
- ATA (godkanda) -- farg: amber/gul

Anvander `recharts` `PieChart`, `Pie`, `Cell` med `innerRadius` for donut-effekt. Totalt varde visas i mitten av donut.

### 2. Projektinformation redesign

**Fil:** `src/components/projects/ProjectOverviewTab.tsx` (inline i JSX)

- Byt fran vertikala label/value-block till horisontella rader med ikon + label + varde pa samma rad
- Varje rad far en tunn separator
- Ta bort Status-faltet fran projektinformation (det visas redan i ProjectPhaseIndicator)
- Behall edit-funktionalitet (pencil-knappen)
- Snyggare typografi: labels i muted-foreground, varden i font-medium

Ny rad-layout (i read-mode):
```text
Link2-ikon    Kopplad offert     OFF-2026-0048 ->
Calendar-ikon Startdatum         15 feb 2026
Wallet-ikon   Budget             250 000 kr
```

### 3. Flytta ekonomisk oversikt

**Fil:** `src/components/projects/ProjectOverviewTab.tsx`

Andrar ordningen i JSX:
- `grid md:grid-cols-2` med EconomicOverviewCard forst (vanster) och Projektinformation (hoger)
- ProjectPhaseIndicator efter detta grid

### Tekniska detaljer

**Nya importer i EconomicOverviewCard:**
- `PieChart, Pie, Cell, ResponsiveContainer` fran `recharts`

**Inga nya beroenden** -- `recharts` ar redan installerat.

**Inga databasandringar** -- all data hamtas redan.

Ta bort Status-faltet fran projektinformations-kortet (bade read-mode och edit-mode), eftersom planeringsindikatorn redan visar detta.

