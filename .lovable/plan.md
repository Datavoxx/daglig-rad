

## Uppgradera Oversikts-PDF: Temafarg, cirkeldiagram och battre information

### Problem som fixas

1. **Forsattssidan visar fel "arbetade timmar"**: Forsattssidan summerar `daily_reports.total_hours` (dagrapport-timmar), men KPI-sidan anvander `time_entries.hours` (tidrapporterade timmar). Dessa ar olika datakallor och visar olika siffror. Forsattssidan ska anvanda samma kalla som KPI:erna (time_entries).

2. **Saknar appens temafarger**: PDF:en anvander teal (`[13, 148, 136]`) istallet for appens gron (`[34, 197, 94]` -- BYGGIO_GREEN). Alla farger ska uppdateras till att matcha appen.

3. **Saknar cirkeldiagram**: Dashboardsidan visar bara KPI-rutor och en tabell. Ett cirkeldiagram (donut) ska laggas till som visar fordelningen Marginal / Utgifter / ATA -- precis som i appen.

4. **Inte tillrackligt informativ**: Forsattssidan ska visa korrekt data fran KPI:erna istallet for separata berakningar fran dagrapporter.

### Andringar i detalj

**Fil: `src/lib/generateProjectPdf.ts`**

#### 1. Uppdatera alla farger till appens tema
- `PRIMARY` andras fran teal `[13, 148, 136]` till BYGGIO_GREEN `[34, 197, 94]`
- KPI-korten far konsekvent fargpalett som matchar appen
- Tabellhuvuden och linjer anvander den grona temat

#### 2. Fixa forsattssidans statistik
- Ta bort de separata berakningarna fran `daily_reports` (raderna som beraknar `totalHours` fran rapporter)
- Anvand istallet `kpiData` for att visa korrekt statistik pa forsattssidan:
  - "Totalt arbetade timmar: X h" (fran `kpiData.totalHours`)
  - "Medarbetare: X"
  - "Dagrapporter: X"
  - "ATA-arbeten: X"
- Nar `kpiData` saknas, faller den tillbaka till grundlaggande rapportdata

#### 3. Lagg till cirkeldiagram (donut) pa dashboardsidan
- Rita en donut-chart med jsPDF:s cirkel-primitiver (arc/ellipse)
- Tre segment: Marginal (gron), Utgifter (rod), ATA (amber)
- Centraltext med totalvardet
- Fargforklaring (legend) under diagrammet
- Placeras mellan KPI-gridden och den ekonomiska tabellen
- Implementeras med `doc.setFillColor()` + `doc.ellipse()` och vinklar for varje segment, alternativt anvanda sektorer via linjer och bagar

#### 4. Battre informationstathtet
- Forsattssidan visar projektperiod, antal medarbetare, och ekonomisk snabb-sammanfattning
- Dashboardsidan far tydligare layout med cirkeldiagrammet som visuellt centrum

### Filandringar

| Fil | Andring |
|-----|---------|
| `src/lib/generateProjectPdf.ts` | Uppdatera PRIMARY-farg till gron, fixa forsattssidans statistik att anvanda kpiData, lagg till donut-chart pa dashboardsidan, forbattra informationsdensitet |

