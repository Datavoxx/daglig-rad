

## Projekt-Dashboard med KPI:er, Planeringsstatus och Ekonomi

En komplett redesign av projektöversikten till en modern dashboard med 6 KPI-kort, en visuell planeringsindikator och ekonomisk sammanfattning.

### Layout

```text
+------------------+------------------+------------------+
|  Totala timmar   |  Medarbetare     |  Dagrapporter    |
|  142.5h          |  3 personer      |  12 st           |
|  [sparkline]     |  [sparkline]     |  [sparkline]     |
+------------------+------------------+------------------+
|  Marginal        |  ATA-arbeten     |  Ekonomi         |
|  32%             |  4 st / 48 500kr |  285 000 kr      |
|  [sparkline]     |  [sparkline]     |  utgifter        |
+------------------+------------------+------------------+

+---------------------------------------------------------------------+
|  Planeringsstatus                                                    |
|  [Planering] --- [Pagaende] --- [*Slutskede*] --- [Avslutat]        |
|  Fas-indikator med progress + aktuella faser fran project_plans      |
+---------------------------------------------------------------------+

+----------------------------------+-----------------------------------+
|  Projektinformation              |  Ekonomisk oversikt               |
|  (befintligt redigerbart kort)   |  (befintligt EconomicOverviewCard)|
+----------------------------------+-----------------------------------+

+---------------------------------------------------------------------+
|  Tidsrapportering (befintligt, oforandrat)                           |
+---------------------------------------------------------------------+
```

### 1. KPI-kort (6 stycken)

All data hamtas i en enda `useEffect` + `Promise.all` direkt i `ProjectOverviewTab`. Anvander befintlig `KpiCard`-komponent.

| KPI | Data | Ikon | Farg | Subtitle |
|-----|------|------|------|----------|
| **Totala timmar** | SUM(time_entries.hours) | Clock | blue | "rapporterat" |
| **Medarbetare** | COUNT(DISTINCT time_entries.user_id) | Users | violet | "personer" |
| **Dagrapporter** | COUNT(daily_reports) | BookOpen | primary | "rapporter" |
| **Marginal** | ((offert+ata-utgifter)/offert)*100 | TrendingUp | emerald/red | "av projektvarde" |
| **ATA-arbeten** | COUNT + SUM(subtotal) | FileEdit | amber | formatCurrency(summa) |
| **Utgifter** | vendor_invoices + labor cost | Receipt | red | "totalt" |

Sparkline-data for timmar och dagrapporter beraknas per vecka (senaste 8 veckorna).

### 2. Planeringsstatus-sektion (ny komponent)

En visuell fas-indikator som visar var projektet befinner sig.

**Ny komponent:** `ProjectPhaseIndicator` (skapas inline i `ProjectOverviewTab` eller som separat komponent)

Logik:
- Anvander `project.status` for att visa vilken fas: `planning`, `active`, `closing`, `completed`
- Visar en horisontell stepper med 4 steg och fyllda/ofyllda cirklar
- Om `project_plans` finns: visar aktuell fas fran planeringen (t.ex. "Stomme - vecka 3 av 8")
- Progress-bar baserad pa hur langt projektet kommit i planeringen

Design:
- Rundade steg med ikoner, kopplat med en linje
- Aktiv fas har primar-farg och pulsande ring
- Avklarade faser har checkmark
- Framtida faser ar gra/dimda

Hamtar `project_plans` data (phases, total_weeks, start_date) for att berakna vilken fas som ar aktiv baserat pa dagens datum.

### 3. Tekniska detaljer

**Fil som andras:** `src/components/projects/ProjectOverviewTab.tsx`

**Nya importer:**
- `KpiCard` fran `@/components/dashboard/KpiCard`
- `Clock, Users, BookOpen, TrendingUp, FileEdit, Receipt, Check, CircleDot` fran `lucide-react`
- `Progress` fran `@/components/ui/progress`
- `useMemo` fran React

**Ny datahämtning i useEffect:**
```
Promise.all([
  supabase.from("time_entries").select("id, hours, user_id, date, billing_types(hourly_rate)").eq("project_id", project.id),
  supabase.from("daily_reports").select("id, report_date").eq("project_id", project.id),
  supabase.from("project_ata").select("id, subtotal, status").eq("project_id", project.id),
  supabase.from("vendor_invoices").select("id, total_inc_vat").eq("project_id", project.id),
  supabase.from("project_plans").select("phases, total_weeks, start_date").eq("project_id", project.id).maybeSingle(),
])
```

**Ny state:**
```
const [dashboardData, setDashboardData] = useState({
  timeEntries: [], diaryReports: [], atas: [], vendorInvoices: [], plan: null
})
```

**KPI-berakningar via useMemo:**
- Totala timmar, unika anvandare, dagrapporter-antal
- Marginal-procent (ateranvander EconomicOverviewCard-logik)
- ATA-antal och summa
- Utgiftstotal (vendor + labor)
- Sparkline-arrayer per vecka

**Fas-indikator:**
Renderas som en `Card` med en flexbox-rad av 4 steg. Varje steg har:
- Cirkel med ikon (Check for avklarat, CircleDot for aktivt, tomt for framtida)
- Label under ("Planering", "Pagaende", "Slutskede", "Avslutat")
- Linje mellan stegen (fargad up till aktivt steg)

Om plan finns med faser visas aven aktuell fas-namn och progress-bar under steppern.

**Befintliga komponenter behalles:**
- `EconomicOverviewCard` -- oforandrad, visas under KPI-korten
- `ProjectTimeSection` -- oforandrad, visas langst ner
- Projektinformation-kortet -- oforandrat med redigeringsfunktionalitet
- Completion-dialogen -- oforandrad

