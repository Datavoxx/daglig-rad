

## Ta bort dubbla animationer fran sidor inuti AppLayout

### Analys

`RouteTransition` wrappar ALLA sidor inuti `AppLayout` och lagger pa `page-transition`. Sidor **utanfor** AppLayout (Auth, Register, NotFound, AttendanceScan) har ingen RouteTransition -- dar ar sidans egen klass den enda animationen, sa de ska behallas.

### Resultat av genomgang

**Sidor med DUBBEL animation (inuti AppLayout + egen klass) -- BEHOVER FIXAS:**

| Fil | Rad(er) | Klass | Problem |
|-----|---------|-------|---------|
| `src/pages/Estimates.tsx` | 161, 247, 262, 275 | `page-transition` | Dubbel `page-transition` |
| `src/pages/Planning.tsx` | 298, 307 | `page-transition` | Dubbel `page-transition` |
| `src/pages/Guide.tsx` | 54 | `page-transition` | Dubbel `page-transition` |
| `src/pages/Dashboard.tsx` | 309 | `animate-in` | Annan animation an alla andra sidor |

**Sidor UTANFOR AppLayout (ingen RouteTransition) -- BEHALLS SOM DE AR:**

| Fil | Klass | Varfor behalles |
|-----|-------|-----------------|
| `src/pages/Auth.tsx` | `page-transition` | Inte inuti RouteTransition, enda kalllan |
| `src/pages/Register.tsx` | `page-transition` | Inte inuti RouteTransition |
| `src/pages/NotFound.tsx` | `page-transition` | Inte inuti RouteTransition |

**Sidor utan egen animation (korrekt beteende) -- INGEN ANDRING:**
Customers, Settings, Invoices, TimeReporting, Attendance, DailyReports, PayrollExport, Projects, ProjectView, Profile, GlobalAssistant, ServiceHomeDashboard, EmployeeDashboard, Inspections, InspectionNew, InspectionView, ReportView

### Andringar

1. **`src/pages/Estimates.tsx`** -- Ta bort `page-transition` fran 4 stallen:
   - Rad 161: `"page-transition p-6 max-w-6xl mx-auto"` -> `"p-6 max-w-6xl mx-auto"`
   - Rad 247: `"page-transition p-4 md:p-6 max-w-6xl mx-auto"` -> `"p-4 md:p-6 max-w-6xl mx-auto"`
   - Rad 262: `"page-transition p-4 md:p-6 max-w-6xl mx-auto"` -> `"p-4 md:p-6 max-w-6xl mx-auto"`
   - Rad 275: `"page-transition p-4 md:p-6 max-w-6xl mx-auto space-y-4 md:space-y-6"` -> `"p-4 md:p-6 max-w-6xl mx-auto space-y-4 md:space-y-6"`

2. **`src/pages/Planning.tsx`** -- Ta bort `page-transition` fran 2 stallen:
   - Rad 298: `"page-transition p-6 max-w-5xl mx-auto"` -> `"p-6 max-w-5xl mx-auto"`
   - Rad 307: `"page-transition p-6 max-w-5xl mx-auto space-y-6"` -> `"p-6 max-w-5xl mx-auto space-y-6"`

3. **`src/pages/Guide.tsx`** -- Ta bort `page-transition` fran 1 stalle:
   - Rad 54: `"page-transition max-w-4xl mx-auto space-y-10"` -> `"max-w-4xl mx-auto space-y-10"`

4. **`src/pages/Dashboard.tsx`** -- Ta bort `animate-in` fran 1 stalle:
   - Rad 309: `"space-y-6 animate-in"` -> `"space-y-6"`

**OBS:** `animate-fade-in` pa rad 467 och 532 i Dashboard.tsx ar **item-animationer** (per rad i en lista), inte sidladdningsanimationer. De behalls.

### Resultat
Alla sidor inuti AppLayout far exakt samma animation via `RouteTransition` -- en enda `page-transition`. Ingen dubbel eller avvikande animation langre.
