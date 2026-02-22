

## Projektstart-flode och aterlagg "Lat Byggio AI hjalpa dig"-knappen

### Sammanfattning

Tva huvudandringar:
1. **Nytt projektstart-flode**: Nar man klickar "Skapa projekt" navigeras man direkt in i projektet, dar en onboarding-wizard (dialog-steg) guider anvandaren genom start/slutdatum, budget (med mojlighet att koppla till offertbelopp), och slutligen en uppmaning att skapa planering.
2. **Aterlagg "Lat Byggio AI hjalpa dig"-knappen**: Den kompakta VoicePromptButton (variant="compact") som togs bort av misstag ska laggas tillbaka i EstimateBuilder, ReportEditor, ProjectAtaTab, ProjectWorkOrdersTab, InspectionView och ProjectPlanningTab.

---

### Del 1: Nytt projektstart-flode

**Nuvarande flode:** Man valjer offert i en dialog, klickar "Skapa projekt", far en toast och stannar pa projektsidan.

**Nytt flode:**
1. Klicka "Skapa projekt" -> projektet skapas i databasen -> navigera direkt till `/projects/{id}`
2. Inne pa projektet visas en onboarding-dialog (steg-for-steg):
   - **Steg 1: Start- och slutdatum** - Tva datumvaljare. Startdatum och slutdatum (nytt i vyn, kolumnen `end_date` finns redan i databasen).
   - **Steg 2: Budget** - Inmatningsfalt for budget. En knapp "Koppla till offertbelopp" som fyller i offertens `total_incl_vat` automatiskt. Man kan aven skriva in en egen budget.
   - Klicka "Klar" -> spara allt till databasen.
3. Efter "Klar" visas en liten banner/prompt: "Dags att skapa en planering for ditt projekt" med en knapp som navigerar till planerings-fliken, samt en X-knapp for att stanga.

**Filer som andras:**

| Fil | Andring |
|-----|---------|
| `src/pages/Projects.tsx` | I `handleSubmit`, efter att projektet skapats, navigera till `/projects/{nyttProjektId}?onboarding=true` istallet for att bara visa toast. |
| `src/components/projects/ProjectOverviewTab.tsx` | (1) Lagg till `end_date` i formData, handleSave och vyn. (2) Skapa en ny `ProjectOnboardingDialog`-komponent som visas nar URL har `?onboarding=true`. Dialogen har 2 steg (datum + budget) och en slutprompt for planering. |
| `src/pages/ProjectView.tsx` | Skicka `onboarding`-query-param vidare till `ProjectOverviewTab`. |

**Databasandring:** Ingen - `end_date` kolumnen finns redan.

---

### Del 2: Visa slutdatum i projektinformation

**Filer som andras:**

| Fil | Andring |
|-----|---------|
| `src/components/projects/ProjectOverviewTab.tsx` | Lagg till `end_date` i: (1) Project-interface, (2) formData state, (3) handleSave, (4) redigerings-UI (ny datumvaljare), (5) visnings-UI (ny rad under startdatum). |

---

### Del 3: Aterlagg "Lat Byggio AI hjalpa dig"-knappen

**Vad ska aterlaggas:** Den kompakta `VoicePromptButton` med `variant="compact"` och `agentName="Byggio AI"`. Det ar den lilla knappen med texten "Lat Byggio AI hjalpa dig" - INTE den stora mikrofonsymbolen/overlayet.

**Filer som andras:**

| Fil | Andring |
|-----|---------|
| `src/components/estimates/EstimateBuilder.tsx` | Lagg till VoicePromptButton (compact) ovanfor offerttabellen. Import + state (`isApplyingVoice`) + handler (`handleVoiceEdit` som anropar `apply-estimate-voice-edits`). |
| `src/components/reports/ReportEditor.tsx` | Lagg till VoicePromptButton (compact). Import + state + handler (anropar `apply-voice-edits`). |
| `src/components/projects/ProjectAtaTab.tsx` | Lagg till VoicePromptButton (compact). Import + state + handler. |
| `src/components/projects/ProjectWorkOrdersTab.tsx` | Lagg till VoicePromptButton (compact). Import + state + handler. |
| `src/pages/InspectionView.tsx` | Lagg till VoicePromptButton (compact). Import + state + handler. |
| `src/components/projects/ProjectPlanningTab.tsx` | Lagg till VoicePromptButton (compact) i input-staten bredvid textarean. |

Varje fil far tillbaka:
- `import { VoicePromptButton } from "@/components/shared/VoicePromptButton";`
- En `isVoiceProcessing` / `isApplyingVoice` state
- En handler-funktion som skickar transkriptet till ratt edge function
- Knappen renderas med `variant="compact"` och `agentName="Byggio AI"`

---

### Sammanfattning av alla andringar

| Fil / Resurs | Andring |
|------|-----------|
| `src/pages/Projects.tsx` | Navigera till projektet direkt efter skapande |
| `src/pages/ProjectView.tsx` | Skicka onboarding-param till ProjectOverviewTab |
| `src/components/projects/ProjectOverviewTab.tsx` | Ny onboarding-dialog (datum + budget + planering-prompt), end_date i form och vy |
| `src/components/estimates/EstimateBuilder.tsx` | Aterlagg VoicePromptButton (compact) |
| `src/components/reports/ReportEditor.tsx` | Aterlagg VoicePromptButton (compact) |
| `src/components/projects/ProjectAtaTab.tsx` | Aterlagg VoicePromptButton (compact) |
| `src/components/projects/ProjectWorkOrdersTab.tsx` | Aterlagg VoicePromptButton (compact) |
| `src/pages/InspectionView.tsx` | Aterlagg VoicePromptButton (compact) |
| `src/components/projects/ProjectPlanningTab.tsx` | Aterlagg VoicePromptButton (compact) |

