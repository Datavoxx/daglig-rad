

## Uppgradera Oversikts-PDF med KPI-dashboard

### Vad som ska goras

Den nuvarande oversikts-PDF:en har en enkel forsattssida med bara grundlaggande statistik (timmar, avvikelser, ATA-antal). Den ska uppgraderas med en professionell KPI-sida som matchar dashboarden i appen -- samma 6 KPI:er plus ekonomisk oversikt.

### KPI:er som laggs till pa sida 2 (ny "Dashboard-sida")

| KPI | Varde | Kalla |
|-----|-------|-------|
| Totala timmar | Summerade timmar fran time_entries | time_entries |
| Medarbetare | Unika anvandare | time_entries |
| Dagrapporter | Antal rapporter | daily_reports |
| Marginal | (Projektvarde - Utgifter) / Projektvarde i % | Beraknat |
| ATA-arbeten | Antal + totalbelopp | project_ata |
| Utgifter | Totalt leverantorsfakturor | vendor_invoices |

### Andringar

**Fil 1: `src/pages/ProjectView.tsx`** (handleOverviewPdf)

Utoka datahamtningen att aven hamta:
- `time_entries` (timmar, user_id) for projektet
- `project_ata` (subtotal, status) for projektet
- `vendor_invoices` (total_inc_vat) for projektet
- `project_estimates` (total_incl_vat) for kopplad offert

Skicka med denna data till `generateProjectPdf` via ett nytt `kpiData`-objekt.

**Fil 2: `src/lib/generateProjectPdf.ts`**

1. Utoka `ProjectReport`-interfacet med ett valfritt `kpiData`-objekt:
   - totalHoursReported, uniqueWorkers, reportCount, marginPercent, ataCount, ataTotal, expensesTotal, quoteValue

2. Lagg till en ny **sida 2** efter forsattssidan -- "PROJEKTDASHBOARD":
   - Rendera 6 KPI-rutor i ett 3x2 grid med fargade bakgrunder (runda horn, teal/violett/gron/rod/amber)
   - Varje ruta visar: titel, stort varde, undertitel
   - Under KPI-gridden: en ekonomisk sammanfattning med offertbelopp, utgifter, ATA-total och beraknad marginal

3. Layout for KPI-gridden (3 kolumner, 2 rader):
   ```text
   +------------------+------------------+------------------+
   | Totala timmar    | Medarbetare      | Dagrapporter     |
   | 8.0 rapporterat  | 1 personer       | 0 rapporter      |
   +------------------+------------------+------------------+
   | Marginal         | ATA-arbeten      | Utgifter         |
   | -770% av proj.   | 1   460 kr       | 4 tkr totalt     |
   +------------------+------------------+------------------+
   ```

4. Ekonomisk sammanfattning under gridden:
   - Offertbelopp
   - Godkanda ATA
   - Totala utgifter (leverantorsfakturor)
   - Beraknad marginal

5. Befintlig dagrapport-sektion (sida 3+) forblir oforandrad.

6. Ta bort kravet pa att dagrapporter maste finnas -- PDF:en ska kunna genereras aven utan dagrapporter (bara KPI-sidan visas da).

### Visuell design i PDF

- KPI-rutorna far ljusa bakgrundsfyllningar (rundade rektanglar)
- Stora siffror i mork text, titlar i mutad farg
- Ekonomisk sammanfattning som en snygg tabell med autoTable
- Fargkodad marginal (gron om positiv, rod om negativ)

### Filandringar

| Fil | Andring |
|-----|---------|
| `src/lib/generateProjectPdf.ts` | Utoka interface, lagg till KPI-dashboard-sida med 6 KPI-rutor + ekonomisk sammanfattning |
| `src/pages/ProjectView.tsx` | Hamta extra data (time_entries, ATA, vendor_invoices, estimate) och skicka som kpiData |

