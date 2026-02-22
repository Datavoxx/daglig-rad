

## Forbattringar: Projektstart-popup, Dagar istallet for veckor, Ta bort mikrofon

### Sammanfattning

Tre huvudandringar: (A) Popup vid forsta besok i nytt projekt for startdatum, slutdatum och budget. (B) Andra planeringssystemet fran veckor till dagar sa att flera faser kan finnas under en vecka. (C) Ta bort den flytande mikrofon-knappen (VoiceInputOverlay och VoicePromptButton) fran hela plattformen.

---

### A. Forsta-gangspopup for nya projekt

**Problem:** Nar man skapar eller oppnar ett nytt projekt saknas en strukturerad onboarding for startdatum, slutdatum och budget.

**Databasandring:**
- Lagg till kolumnen `end_date` (date, nullable) i tabellen `projects`.

**Implementation i `src/pages/ProjectView.tsx`:**
- Nar projektet laddas och `start_date` ar null (aldrig ifyllt), visa en `Dialog` med tre steg:
  - **Steg 1:** Startdatum (datepicker), Slutdatum (datepicker), Budget (input med siffror).
    - Knapp: "Hamta fran offert" som fyller i budget fran den kopplade offertens `total_incl_vat`.
  - **Steg 2:** Nar anvandaren klickar "Ga vidare", spara vaerdena till `projects`-tabellen och visa planeringsfloden (samma som "Skapa planering" i ProjectPlanningTab).
- Startdatum och slutdatum sparas pa projektet och anvands sedan i planeringen.

**Filer som andras:**
| Fil | Andring |
|-----|---------|
| `src/pages/ProjectView.tsx` | Lagg till forsta-gangs-dialog med start, slut, budget |
| Migration | Lagg till `end_date` i `projects` |

---

### B. Dagar istallet for veckor i planeringen

**Problem:** Planeringsfaser ar begransade till minst en vecka. Anvandaren vill kunna ha faser pa dagsniva sa att flera faser kan finnas inom samma vecka.

**Databasandring:**
- Kolumnen `total_weeks` i `project_plans` behaller sitt namn men representerar nu total langd i dagar (eller sa laggs `total_days` till). For bakatkompabilitet: lagg till `total_days` (integer, nullable) i `project_plans`. Om `total_days` finns anvands det, annars faller det tillbaka pa `total_weeks * 5` (arbetsdagar).

**Fasmodell-andring:**
Den nuvarande fasen ser ut sa har:
```
{ name, start_week, duration_weeks, color, description }
```
Ny modell (faserna sparas fortfarande som JSON i `phases`):
```
{ name, start_day, duration_days, color, description }
```
Bakatkompabilitet: Om `start_day` saknas, konvertera `start_week` -> `(start_week - 1) * 5 + 1` och `duration_weeks` -> `duration_weeks * 5`.

**Filer som andras:**

| Fil | Andring |
|-----|---------|
| `src/components/planning/GanttTimeline.tsx` | Andras fran veckobaserat till dagbaserat rutsystem. Varje dag ar en kolumn, med veckovisa grupperingar i headern. |
| `src/components/planning/PlanEditor.tsx` | Byt "Start (vecka)" och "Langd (veckor)" mot "Start (dag)" och "Langd (dagar)". Visa projektets start/slutdatum. |
| `src/components/planning/PlanningMobileOverview.tsx` | Uppdatera fran vecko- till dagberakningar. |
| `src/components/planning/PhaseFlipCard.tsx` | Uppdatera text fran "veckor" till "dagar". |
| `src/components/projects/ProjectPlanningTab.tsx` | Uppdatera PlanPhase-interfacet, parsePhasesFromJson, phasesToJson. Skicka projektets start/slutdatum till generate-plan. |
| `src/components/projects/ProjectOverviewTab.tsx` | Uppdatera GanttTimeline-anropet for dagbaserad data. |
| `src/pages/Planning.tsx` | Uppdatera for ny fasmodell. |
| `supabase/functions/generate-plan/index.ts` | Andras prompten till att generera `start_day` och `duration_days` istallet for `start_week` och `duration_weeks`. Informera AI:n om projektets totala langd i dagar baserat pa start/slutdatum. |
| Migration | Lagg till `total_days` i `project_plans` |

**GanttTimeline-anpassning for dagar:**
- Istallet for att visa varje dag som en kolumn (kan bli for brett), gruppera visuellt per vecka men tillat faser att starta/sluta mitt i en vecka.
- Headern visar veckonummer (V1, V2, ...) med datumintervall under.
- Fasernas position beraknas pa dagsniva: `left = (start_day - 1) / total_days * 100%`, `width = duration_days / total_days * 100%`.

---

### C. Ta bort flytande mikrofon-knappen

**Problem:** Anvandaren vill ta bort VoiceInputOverlay (den flytande mikrofonknappen i nedre hogra hornet) och VoicePromptButton fran hela plattformen.

**Filer som andras:**

| Fil | Andring |
|-----|---------|
| `src/components/estimates/EstimateBuilder.tsx` | Ta bort VoiceInputOverlay och VoicePromptButton, deras imports och relaterad state/logik (isApplyingVoice, handleVoiceEdit) |
| `src/components/reports/ReportEditor.tsx` | Ta bort VoiceInputOverlay, import och relaterad logik |
| `src/components/planning/PlanEditor.tsx` | Ta bort VoiceInputOverlay, AI-avatar-sektionen och relaterad logik |
| `src/components/projects/ProjectPlanningTab.tsx` | Ta bort useVoiceRecorder-hooken och all rostinspelnings-UI (Mic-knappen, inspelningsstatus, etc.) |
| `src/components/projects/ProjectAtaTab.tsx` | Ta bort VoicePromptButton och relaterad logik |
| `src/components/projects/ProjectWorkOrdersTab.tsx` | Ta bort VoicePromptButton och relaterad logik |
| `src/components/estimates/EstimateSummary.tsx` | Ta bort VoiceInputOverlay och relaterad logik |
| `src/pages/InspectionView.tsx` | Ta bort VoiceInputOverlay och relaterad logik |
| `src/pages/Planning.tsx` | Ta bort VoiceRecorder-relaterad logik |

**OBS:** Sjalva filerna `VoiceInputOverlay.tsx` och `VoicePromptButton.tsx` behalles kvar (de kan behova anvandas i framtiden) men alla anvandningar tas bort.

---

### Sammanfattning av alla filandringar

| Fil | Forandring |
|-----|-----------|
| Migration | `end_date` pa `projects`, `total_days` pa `project_plans` |
| `src/pages/ProjectView.tsx` | Forsta-gangs-dialog med start, slut, budget + planering |
| `src/components/planning/GanttTimeline.tsx` | Dagbaserat rutsystem |
| `src/components/planning/PlanEditor.tsx` | Dag-inputs, ta bort mikrofon |
| `src/components/planning/PlanningMobileOverview.tsx` | Dagberakningar |
| `src/components/planning/PhaseFlipCard.tsx` | Text: dagar |
| `src/components/projects/ProjectPlanningTab.tsx` | Ny fasmodell, ta bort rost |
| `src/components/projects/ProjectOverviewTab.tsx` | Dagbaserad Gantt |
| `src/pages/Planning.tsx` | Ny fasmodell, ta bort rost |
| `supabase/functions/generate-plan/index.ts` | Prompt: dagar, ta emot start/slutdatum |
| `src/components/estimates/EstimateBuilder.tsx` | Ta bort mikrofon |
| `src/components/reports/ReportEditor.tsx` | Ta bort mikrofon |
| `src/components/projects/ProjectAtaTab.tsx` | Ta bort mikrofon |
| `src/components/projects/ProjectWorkOrdersTab.tsx` | Ta bort mikrofon |
| `src/components/estimates/EstimateSummary.tsx` | Ta bort mikrofon |
| `src/pages/InspectionView.tsx` | Ta bort mikrofon |

