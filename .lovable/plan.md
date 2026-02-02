

## Plan: Reducera AI-agenter till 3 stycken

### Ändring

Minska antalet AI-agenter från 6 till 3:
- **Behåll:** Saga, Bo, Ulla
- **Ta bort:** Erik, Märta, Oscar

### Nya ansvarsområden

| Agent | Ansvarsområden |
|-------|----------------|
| **Saga** | Offerter, Mallar |
| **Bo** | Projektplanering |
| **Ulla** | Dagrapporter, ÄTA, Arbetsorder, Egenkontroll |

---

### Alla röstinspelningsplatser (kartläggning)

| Plats | Fil | Nuvarande | Ny Agent |
|-------|-----|-----------|----------|
| Offert | `EstimateBuilder.tsx` | Saga | Saga ✓ |
| Offert Summering | `EstimateSummary.tsx` | - | Saga |
| Skapa Mall | `CreateTemplateDialog.tsx` | Oscar | Saga |
| Planering | `PlanEditor.tsx` | Bo | Bo ✓ |
| Dagbok (inline) | `InlineDiaryCreator.tsx` | Ulla | Ulla ✓ |
| Dagrapport (editor) | `ReportEditor.tsx` | Ulla | Ulla ✓ |
| Arbetsorder | `ProjectWorkOrdersTab.tsx` | Märta | Ulla |
| ÄTA | `ProjectAtaTab.tsx` | Märta | Ulla |
| Egenkontroll | `InspectionView.tsx` | Erik | Ulla |

---

### Tekniska ändringar

#### 1. Uppdatera aiAgents.ts

**Fil: `src/config/aiAgents.ts`**

```typescript
// Ta bort: inspection (Erik), workOrder (Märta), template (Oscar)
// Uppdatera beskrivningar för nya ansvarsområden

export const AI_AGENTS = {
  estimate: {
    name: "Saga",
    title: "Saga AI",
    description: "Din kalkylexpert",
    promptIntro: "Du heter Saga och är en expert på offerter och kalkyler för byggprojekt i Sverige.",
  },
  planning: {
    name: "Bo",
    title: "Bo AI",
    description: "Din projektplanerare",
    promptIntro: "Du heter Bo och är en expert på byggprojektplanering med lång erfarenhet av att organisera tidplaner.",
  },
  diary: {
    name: "Ulla",
    title: "Ulla AI",
    description: "Din dokumentationsassistent",
    promptIntro: "Du heter Ulla och är en erfaren dokumentationsassistent för svenska byggarbetsplatser. Du hjälper till med dagrapporter, ÄTA, arbetsorder och egenkontroller.",
  },
} as const;
```

#### 2. Uppdatera UI-komponenter

| Fil | Ändring |
|-----|---------|
| `ProjectWorkOrdersTab.tsx` | Ändra `agentName="Märta AI"` → `"Ulla AI"` |
| `ProjectAtaTab.tsx` | Ändra `agentName="Märta AI"` → `"Ulla AI"` |
| `InspectionView.tsx` | Ändra `agentName="Erik AI"` → `"Ulla AI"` |
| `EstimateSummary.tsx` | Lägg till `agentName="Saga AI"` |
| `CreateTemplateDialog.tsx` | Uppdatera text till "Låt Saga AI hjälpa dig" |

#### 3. Uppdatera Edge Functions

**Systemprompts att uppdatera:**

| Edge Function | Nuvarande | Ny Agent |
|---------------|-----------|----------|
| `apply-voice-edits` (workOrder) | Märta | Ulla |
| `apply-voice-edits` (ata) | Märta | Ulla |
| `apply-voice-edits` (inspection) | Erik | Ulla |
| `prefill-inspection` | Erik | Ulla |
| `parse-template-voice` | Oscar | Saga |

---

### Filer som ändras

**Frontend:**
| Fil | Ändring |
|-----|---------|
| `src/config/aiAgents.ts` | Ta bort Erik, Märta, Oscar; uppdatera Ulla |
| `src/components/projects/ProjectWorkOrdersTab.tsx` | `agentName="Ulla AI"` |
| `src/components/projects/ProjectAtaTab.tsx` | `agentName="Ulla AI"` |
| `src/pages/InspectionView.tsx` | `agentName="Ulla AI"` |
| `src/components/estimates/EstimateSummary.tsx` | Lägg till `agentName="Saga AI"` |
| `src/components/estimates/CreateTemplateDialog.tsx` | Uppdatera text till Saga |

**Edge Functions:**
| Fil | Ändring |
|-----|---------|
| `supabase/functions/apply-voice-edits/index.ts` | Byt ut Märta/Erik → Ulla i prompts |
| `supabase/functions/prefill-inspection/index.ts` | Byt Erik → Ulla |
| `supabase/functions/parse-template-voice/index.ts` | Byt Oscar → Saga |

---

### Resultat

Användaren möter nu bara 3 AI-agenter:

- **Saga** → Offert & Mallar
- **Bo** → Planering
- **Ulla** → Dagbok, ÄTA, Arbetsorder, Egenkontroll

