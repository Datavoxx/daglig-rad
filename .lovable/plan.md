

## Lagg till `page-transition` pa alla sidors interna innehall

### Bakgrund
Offertsidan hade tidigare `page-transition`-klassen pa sina interna `div`-element, vilket skapade en dubbel animation (en fran `RouteTransition` + en fran sidans egen div). Det gav den smidiga "nerifranifrån och upp"-kanslan. Den togs bort i en tidigare andring. Nu vill vi lagga tillbaka den pa **alla** sidor for att ge en konsekvent, smidig upplevelse overallt.

### Vad andras
Varje sidas yttersta `<div>` (inklusive loading/skeleton-states) far klassen `page-transition` tillagd. Detta ger den extra `translateY(4px) + scale(0.98) + fade`-effekten ovanpa den globala `RouteTransition`.

### Filer som andras

**Sidor inuti AppLayout (skyddade sidor):**

| Fil | Antal return-block som andras |
|-----|------|
| `src/pages/Dashboard.tsx` | 1 |
| `src/pages/Settings.tsx` | 1 |
| `src/pages/Profile.tsx` | 1 |
| `src/pages/Projects.tsx` | 1 |
| `src/pages/ProjectView.tsx` | 2 (loading + main) |
| `src/pages/Estimates.tsx` | 4 (loading, wizard, builder, main) |
| `src/pages/Customers.tsx` | 1 |
| `src/pages/Invoices.tsx` | 1 |
| `src/pages/Inspections.tsx` | 1 |
| `src/pages/InspectionNew.tsx` | 1 |
| `src/pages/InspectionView.tsx` | 2 (loading + main) |
| `src/pages/Planning.tsx` | 2 (loading + main) |
| `src/pages/Guide.tsx` | 1 |
| `src/pages/TimeReporting.tsx` | 1 |
| `src/pages/Attendance.tsx` | 1 |
| `src/pages/DailyReports.tsx` | 2 (loading + main) |
| `src/pages/PayrollExport.tsx` | 1 |
| `src/pages/ReportView.tsx` | 1 |
| `src/pages/GlobalAssistant.tsx` | 1 |
| `src/pages/EmployeeDashboard.tsx` | 2 (loading + main) |
| `src/pages/ServiceHomeDashboard.tsx` | 2 (loading + main) |

**Totalt: 21 filer, ~30 andringar**

### Teknisk detalj

Andringsmonstret ar enkelt och identiskt overallt. Exempel:

```text
Fore:  <div className="space-y-6">
Efter: <div className="page-transition space-y-6">
```

For sidor som returnerar `null` vid loading (Settings, Customers) andras bara huvudreturen. For sidor med skeleton-loading (Estimates, Planning, DailyReports, etc.) laggs klassen till pa bade loading- och huvuddiven.

GlobalAssistant andras fran:
```text
<div className="relative flex h-full flex-col overflow-hidden">
```
till:
```text
<div className="page-transition relative flex h-full flex-col overflow-hidden">
```

Inga nya filer, inga nya beroenden, ingen CSS-andring behovs.

