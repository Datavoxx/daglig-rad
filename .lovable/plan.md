

## Ta bort mikrofon och auto-paslag

### Sammanfattning

Tva andringar: (1) Ta bort alla VoiceInputOverlay och VoicePromptButton fran hela plattformen. (2) Ta bort det automatiska paslaget som laggs till nar man skapar en offert (databasens default ar 15%, ska vara 0%).

---

### 1. Ta bort auto-paslag (rotorsaken)

**Problem:** Kolumnen `markup_percent` i tabellen `project_estimates` har ett databasdefaultvarde pa **15**. Det betyder att varje ny offert automatiskt far 15% paslag, aven om anvandaren inte har angett nagot.

**Losning:**
- Databasmigration: Andra default fran 15 till 0 pa `project_estimates.markup_percent`.

| Fil / Resurs | Andring |
|------|---------|
| Migration (SQL) | `ALTER TABLE project_estimates ALTER COLUMN markup_percent SET DEFAULT 0;` |

---

### 2. Ta bort mikrofon-knappen fran hela plattformen

**Problem:** VoiceInputOverlay (flytande mikrofon-knapp) och VoicePromptButton finns kvar i fem filer trots att anvandaren vill att de ska tas bort.

**Filer som andras:**

| Fil | Andring |
|-----|---------|
| `src/components/estimates/EstimateBuilder.tsx` | Ta bort VoiceInputOverlay (rad 665-668 och 741-746), VoicePromptButton (rad 468-474), imports (rad 29-30, 32), isApplyingVoice state (rad 79), handleVoiceEdit funktion (rad 250-340) |
| `src/components/reports/ReportEditor.tsx` | Ta bort VoiceInputOverlay (rad 663-668), import (rad 34-35, 37), isApplyingVoice state, handleVoiceEdit funktion |
| `src/components/projects/ProjectAtaTab.tsx` | Ta bort VoicePromptButton (rad 515-520), import (rad 57-58), isVoiceProcessing state (rad 143), handleVoiceInput funktion (rad 188-235) |
| `src/components/projects/ProjectWorkOrdersTab.tsx` | Ta bort VoicePromptButton (rad 275-280), import (rad 20-21), isVoiceProcessing state (rad 54), handleVoiceInput funktion (rad 57-85) |
| `src/pages/InspectionView.tsx` | Ta bort VoiceInputOverlay (rad 460-465), import (rad 36-37), isApplyingVoice state, handleVoiceEdit funktion |

**OBS:** Sjalva komponentfilerna (`VoiceInputOverlay.tsx`, `VoicePromptButton.tsx`, `useVoiceRecorder.ts`) behalles -- bara anvandningarna tas bort.

---

### Sammanfattning av alla andringar

| Fil / Resurs | Forandring |
|------|-----------|
| Migration | Andra default pa `project_estimates.markup_percent` fran 15 till 0 |
| `src/components/estimates/EstimateBuilder.tsx` | Ta bort VoiceInputOverlay, VoicePromptButton, relaterad state och logik |
| `src/components/reports/ReportEditor.tsx` | Ta bort VoiceInputOverlay och relaterad logik |
| `src/components/projects/ProjectAtaTab.tsx` | Ta bort VoicePromptButton och relaterad logik |
| `src/components/projects/ProjectWorkOrdersTab.tsx` | Ta bort VoicePromptButton och relaterad logik |
| `src/pages/InspectionView.tsx` | Ta bort VoiceInputOverlay och relaterad logik |

