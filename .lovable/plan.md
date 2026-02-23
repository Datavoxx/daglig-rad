
## Fixar: PDF-nedladdning, UI-rensning, tab-navigering och budget i ekonomioversikt

### Problem 1: PDF-nedladdning kraschar
**Orsak:** `generatePlanningPdf.ts` refererar till `phase.start_week` och `phase.duration_weeks` (rad 254-255, 274, 316, 322), men datan lagras nu som `start_day`/`duration_days`. Vardet ar `undefined`, vilket ger NaN-felberakningar och krasch.

**Fix:** Uppdatera `generatePlanningPdf.ts` sa att den konverterar dagbaserade faser till veckobaserade for PDF-rendering, eller accepterar bade format.

### Problem 2: "100% sakerhet" och "Tolkad planering" i PlanEditor
**Orsak:** PlanEditor visar fortfarande `confidence`-badge (rad 116-118) och rubriken "Tolkad planering" (rad 109) - rester fran AI-genereringen.

**Fix i `src/components/planning/PlanEditor.tsx`:**
- Andra rubriken "Tolkad planering" till "Planering" (rad 109)
- Ta bort hela confidence-sektionen (badge + varningsikon, rad 112-119)
- Ta bort `confidence`-prop fran interfacet

### Problem 3: "Skapa planering"-knappen navigerar inte till planerings-fliken
**Orsak:** Bade onboarding-dialogen och oversiktens "Skapa planering"-knapp navigerar till `?tab=planning`, men `ProjectView.tsx` anvander `defaultValue="overview"` i Tabs-komponenten och laser aldrig `tab`-parametern fran URL:en.

**Fix i `src/pages/ProjectView.tsx`:**
- Las `tab`-parametern fran searchParams
- Anvand den som `defaultValue` (eller kontrollerad `value`) i Tabs-komponenten
- Uppdatera URL:en nar anvandaren byter flik

### Problem 4: "Offertbelopp" ska heta "Budget" i ekonomioversikten
**Fix i `src/components/projects/EconomicOverviewCard.tsx`:**
- Andra prop fran `quoteTotal` till `budget` (eller acceptera bada)
- Andra texten "Offertbelopp" (rad 210) till "Budget"
- Uppdatera `ProjectOverviewTab.tsx` sa att den skickar `project.budget` istallet for `linkedEstimate?.total_incl_vat`

### Teknisk sammanfattning

| Fil | Andring |
|------|-----------|
| `src/lib/generatePlanningPdf.ts` | Konvertera `start_day`/`duration_days` till veckobaserat for Gantt-ritning, eller hantera bade vecko- och dagformat. Uppdatera PlanPhase-interface och alla referenser till `start_week`/`duration_weeks`. |
| `src/components/planning/PlanEditor.tsx` | (1) Andra "Tolkad planering" till "Planering". (2) Ta bort confidence-badge och prop. |
| `src/pages/ProjectView.tsx` | Las `tab`-param fran URL och anvand som aktivt tab-varde. Uppdatera URL vid flikbyte. |
| `src/components/projects/EconomicOverviewCard.tsx` | Andra prop-namn och label fran "Offertbelopp" till "Budget". Anvand budget-vardet i berakningar istallet for quoteTotal. |
| `src/components/projects/ProjectOverviewTab.tsx` | Skicka `project.budget` till EconomicOverviewCard istallet for `linkedEstimate?.total_incl_vat`. |
| `src/components/projects/ProjectPlanningTab.tsx` | Ta bort `confidence={1}` och `summary=""` fran PlanEditor-anropet (efter att propen tagits bort). |
