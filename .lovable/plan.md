

## El/VVS Iteration: Operativ Jobbskarm + Ny Hemskarm

### Oversikt

Tva stora leverabler:
1. **ProjectView ombyggs** till operativ jobbskarm for el/VVS (anvander befintliga `JobDetailView` som redan finns)
2. **Ny Hem-sida** for el/VVS-anvandare med dagliga jobb, snabbactions och "klara att fakturera"

Befintliga komponenter som redan ar klara och kan ateranvandas:
- `JobDetailView.tsx` -- redan byggd med pengasummering, tid, material, kvittoscanner, anteckningar, bilder, extraarbete
- `JobActionBar.tsx` -- sticky action bar (mobil bottom, desktop top)
- `JobReceiptScanner.tsx` -- integrerad kvittoscanner
- `JobsList.tsx` -- jobblista med snabbactions
- `CreateJobDialog.tsx` -- skapa nytt jobb

---

### Sprint 1: Aktivera JobDetailView + Hemskarm (KRITISKT)

**1.1 Modifiera `ProjectView.tsx`**

Nar `isServiceIndustry === true`, rendera `JobDetailView` istallet for tab-layouten. (Detta var borttaget i senaste andringen -- nu laggs det tillbaka.)

Andringar:
- Aterinfor `if (isServiceIndustry) return <JobDetailView project={project} />`
- Bygg-anvandare far befintlig tab-vy (ingen andring)

**1.2 Skapa ny `ServiceHomeDashboard.tsx`** (`src/pages/ServiceHomeDashboard.tsx`)

Ny hemskarm for el/VVS med foljande sektioner:

```text
+----------------------------------+
| Hej, [Namn]!        [datum]      |
| Mina jobb idag                   |
+----------------------------------+
| [KPI-strip: 4 kompakta kort]    |
| Pagaende | Planerade | Klara ej  |
| nu       | idag     | fakturerade|
+----------------------------------+
| SNABBATGARDER                    |
| [Nytt jobb] [Lagg tid] [Kvitto] |
| [Material] [Faktura]            |
+----------------------------------+
| MINA JOBB NU (karusell/lista)   |
| [Jobb 1: Kund, adress, status]  |
| [Jobb 2: ...]                   |
| [Jobb 3: ...]                   |
+----------------------------------+
| KLARA ATT FAKTURERA             |
| [Jobb X -- Skapa faktura]       |
| [Jobb Y -- Skapa faktura]       |
+----------------------------------+
| SENASTE AKTIVITET               |
| - Tid registrerad 14:30         |
| - Material tillagt 13:15        |
+----------------------------------+
```

Datakallor:
- `projects` med status-filter
- `project_work_orders` for status
- `work_order_time_entries` for senaste aktivitet
- `work_order_materials` for senaste aktivitet
- `user_pricing_settings` for timpris

Sektioner:
1. **Header**: Halsning + datum
2. **KPI-strip**: 4 kompakta kort (Pagaende, Planerade, Klara ej fakturerade, Timmar denna vecka)
3. **Snabbatgarder**: Knappar for Nytt jobb, Lagg tid, Lagg material, Scanna kvitto, Skapa faktura
4. **Mina jobb nu**: Horisontell karusell (embla-carousel) med aktiva jobbkort, varje kort visar kund/adress/status med snabbactions
5. **Klara att fakturera**: Lista med jobb dar status=completed + faktura ej skapad, med "Skapa faktura"-knapp
6. **Senaste aktivitet**: Senaste 5 handelser (tid, material, kvitton)

**1.3 Modifiera routing och navigation**

Andringar i `App.tsx`:
- Lagg till route for `/service-home` som renderar `ServiceHomeDashboard`
- Behall `/dashboard` for bygg-anvandare

Andringar i `AppLayout.tsx` (nav-items for service):
- Lagg till "Hem" som forsta nav-item for service, pekar pa `/service-home`

Andringar i `BottomNav.tsx`:
- Lagg till "Hem" i `serviceNavItems` som forsta item, pekar pa `/service-home`

**1.4 Sprakandring i ProjectView**

Nar service, visa "Jobb" istallet for "Projekt" i header-texten (back-knapp gar till /projects som redan visar "Jobb").

---

### Sprint 2: Forbattra Jobbdetalj + Jobblista

**2.1 Forbattra JobDetailView**

Smarre forbattringar:
- Lagg till "Fakturastatus" i pengasummeringen (ej fakturerad / fakturautkast / fakturerad)
- Visa faktura-knappen aven nar status ar "in_progress" (inte bara "completed"), men med texten "Skapa faktura" vs "Visa faktura"
- Forbattra "Fler val" i tidsektionen -- visa senaste anvanda typ

**2.2 Forbattra JobsList snabbactions**

Lagg till pa jobbkorten:
- Visa timmar + materialkostnad inline pa kortet (kompakt)
- "Snabb tid"-ikon som oppnar inline tidsinput

---

### Teknisk implementationsplan

**Filer som SKAPAS:**
| Fil | Beskrivning |
|-----|-------------|
| `src/pages/ServiceHomeDashboard.tsx` | Ny hemskarm for el/VVS |

**Filer som MODIFIERAS:**
| Fil | Andring |
|-----|---------|
| `src/pages/ProjectView.tsx` | Aterinfor `isServiceIndustry` branch-check for JobDetailView |
| `src/App.tsx` | Lagg till route `/service-home` |
| `src/components/layout/AppLayout.tsx` | Lagg till "Hem" nav-item for service |
| `src/components/layout/BottomNav.tsx` | Lagg till "Hem" i serviceNavItems |

**Filer som INTE ANDRAS:**
| Fil | Anledning |
|-----|-----------|
| `JobDetailView.tsx` | Redan klar -- fungerar som operativ jobbskarm |
| `JobActionBar.tsx` | Redan klar -- sticky actions |
| `JobReceiptScanner.tsx` | Redan klar -- kvitto i jobb |
| `JobsList.tsx` | Redan klar med snabbactions |
| `CreateJobDialog.tsx` | Redan klar |

### Ingen databasandring kravs

Alla tabeller finns redan. Hemskarmens data hamtas fran befintliga tabeller.

### Implementeringsordning

1. Aterinfor branch-check i `ProjectView.tsx` (1 rad)
2. Skapa `ServiceHomeDashboard.tsx` (ny fil)
3. Uppdatera routing i `App.tsx`
4. Uppdatera navigation i `AppLayout.tsx` och `BottomNav.tsx`

