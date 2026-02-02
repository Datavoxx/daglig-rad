

## Plan: AI Agent-identiteter för Byggio

### Sammanfattning av befintliga AI-funktioner

Jag har kartlagt alla AI-agenter och röstfunktioner i appen:

| Område | Edge Function | Syfte | Nuvarande prompt-start |
|--------|---------------|-------|-------------------------|
| **Offert** | `apply-full-estimate-voice` | Fylla i/uppdatera offerter med röst | "Du är en assistent som hjälper till att fylla i..." |
| **Offert** | `generate-estimate` | Generera ny offert från beskrivning | "Du är en expert på offerter för byggprojekt..." |
| **Offert** | `apply-estimate-voice-edits` | Uppdatera offertposter med röst | "Du är en assistent som hjälper till att uppdatera offertposter..." |
| **Offert** | `apply-summary-voice-edits` | Uppdatera projektbeskrivning med röst | "Du är en assistent som hjälper till att uppdatera projektbeskrivningar..." |
| **Planering** | `generate-plan` | Generera projektplanering | "Du är en expert på byggprojektplanering..." |
| **Dagrapport** | `generate-report` | Generera arbetsdagbok | "Du är en svensk platschef-assistent..." |
| **Egenkontroll** | `prefill-inspection` | Förifylla egenkontroller | "Du är en erfaren kvalitetskontrollant..." |
| **Mall** | `parse-template-voice` | Tolka mallbeskrivning | "Du är en expert på offerter för byggprojekt..." |
| **Generell** | `apply-voice-edits` | Redigera dokument (rapport/planering/ÄTA/arbetsorder) | Dynamisk prompt beroende på dokumenttyp |
| **Transkribering** | `transcribe-audio` | Transkribera ljud | "Du är en professionell transkriberings-assistent..." |

---

### Föreslagna Agent-namn

Baserat på olika roller/funktioner:

| Agent-namn | Område | Personlighet |
|------------|--------|--------------|
| **Saga** | Offert & Kalkyl | Expert på kalkyler och prissättning |
| **Bo** | Planering | Erfaren projektplanerare |
| **Ulla** | Dagrapport & Arbetsdagbok | Platschef-assistent |
| **Erik** | Egenkontroll | Kvalitetskontrollant |
| **Märta** | ÄTA & Arbetsorder | Dokumentationsexpert |
| **Oscar** | Mall & Mallar | Mallexpert |

---

### Tekniska ändringar

#### 1. Skapa en central agent-konfiguration

**Ny fil: `src/config/aiAgents.ts`**

```typescript
export interface AIAgent {
  name: string;
  title: string;
  description: string;
  promptIntro: string;  // För edge functions
}

export const AI_AGENTS = {
  estimate: {
    name: "Saga",
    title: "Saga AI",
    description: "Din kalkylexpert",
    promptIntro: "Du heter Saga och är en expert på offerter och kalkyler för byggprojekt."
  },
  planning: {
    name: "Bo",
    title: "Bo AI",
    description: "Din projektplanerare",
    promptIntro: "Du heter Bo och är en expert på byggprojektplanering."
  },
  diary: {
    name: "Ulla",
    title: "Ulla AI",
    description: "Din platschef-assistent",
    promptIntro: "Du heter Ulla och är en erfaren platschef-assistent för byggbranschen."
  },
  inspection: {
    name: "Erik",
    title: "Erik AI",
    description: "Din kvalitetskontrollant",
    promptIntro: "Du heter Erik och är en erfaren kvalitetskontrollant."
  },
  workOrder: {
    name: "Märta",
    title: "Märta AI",
    description: "Din dokumentationsexpert",
    promptIntro: "Du heter Märta och är en dokumentationsexpert för byggprojekt."
  }
} as const;
```

#### 2. Uppdatera VoicePromptButton-komponenten

**Fil: `src/components/shared/VoicePromptButton.tsx`**

Lägg till en `agentName`-prop:

```typescript
interface VoicePromptButtonProps {
  onTranscriptComplete: (transcript: string) => Promise<void>;
  isProcessing?: boolean;
  className?: string;
  subtext?: string;
  variant?: "default" | "compact" | "inline";
  agentName?: string;  // NYTT: t.ex. "Saga AI"
}
```

Ändra default-text från `"Spela in"` till `"Låt {agentName} hjälpa dig"`:

```tsx
// FÖRE (rad 278-279)
<span className="font-medium">Spela in</span>
<span className="text-xs text-muted-foreground">{subtext}</span>

// EFTER
<span className="font-medium">
  {agentName ? `Låt ${agentName} hjälpa dig` : "Spela in"}
</span>
<span className="text-xs text-muted-foreground">
  {subtext}
</span>
```

#### 3. Uppdatera VoiceInputOverlay-komponenten

**Fil: `src/components/shared/VoiceInputOverlay.tsx`**

Lägg till `agentName`-prop för att visa i toast och UI.

#### 4. Uppdatera användningsplatser

| Fil | Komponent | Agent |
|-----|-----------|-------|
| `ProjectWorkOrdersTab.tsx` | VoicePromptButton | Märta AI |
| `ProjectAtaTab.tsx` | VoicePromptButton | Märta AI |
| `InlineDiaryCreator.tsx` | Egen inspelningsknapp | Ulla AI |
| `EstimateBuilder.tsx` | VoiceInputOverlay | Saga AI |
| `PlanEditor.tsx` | VoiceInputOverlay | Bo AI |
| `ReportEditor.tsx` | VoiceInputOverlay | Ulla AI |
| `InspectionView.tsx` | VoiceInputOverlay | Erik AI |

#### 5. Uppdatera edge functions med personlighet

Lägg till namn/personlighet i början av varje system prompt:

**Exempel för `generate-estimate`:**
```typescript
// FÖRE
const systemPrompt = `Du är en expert på offerter för byggprojekt...`;

// EFTER
const systemPrompt = `Du heter Saga och är en expert på offerter för byggprojekt...`;
```

---

### UI-förändringar

**Före:**
```
┌─────────────────────────────────────────────┐
│  🎤 Spela in                                │
│  Spara upp till 70% av din tid              │
└─────────────────────────────────────────────┘
```

**Efter:**
```
┌─────────────────────────────────────────────┐
│  🎤✨ Låt Saga AI hjälpa dig               │
│  Spara upp till 70% av din tid              │
└─────────────────────────────────────────────┘
```

---

### Filer som ändras

| Fil | Ändring |
|-----|---------|
| `src/config/aiAgents.ts` | **NY FIL** - Central agent-konfiguration |
| `src/components/shared/VoicePromptButton.tsx` | Lägg till `agentName` prop och visa i UI |
| `src/components/shared/VoiceInputOverlay.tsx` | Lägg till `agentName` prop |
| `src/components/projects/ProjectWorkOrdersTab.tsx` | Skicka `agentName="Märta AI"` |
| `src/components/projects/ProjectAtaTab.tsx` | Skicka `agentName="Märta AI"` |
| `src/components/projects/InlineDiaryCreator.tsx` | Uppdatera text till "Låt Ulla AI..." |
| `src/components/estimates/EstimateBuilder.tsx` | Skicka `agentName="Saga AI"` |
| `src/components/planning/PlanEditor.tsx` | Skicka `agentName="Bo AI"` |
| `src/components/reports/ReportEditor.tsx` | Skicka `agentName="Ulla AI"` |
| `src/pages/InspectionView.tsx` | Skicka `agentName="Erik AI"` |

**Edge functions att uppdatera (systemPrompt med namn):**
| Fil | Agent-namn |
|-----|------------|
| `supabase/functions/apply-full-estimate-voice/index.ts` | Saga |
| `supabase/functions/generate-estimate/index.ts` | Saga |
| `supabase/functions/apply-estimate-voice-edits/index.ts` | Saga |
| `supabase/functions/apply-summary-voice-edits/index.ts` | Saga |
| `supabase/functions/generate-plan/index.ts` | Bo |
| `supabase/functions/generate-report/index.ts` | Ulla |
| `supabase/functions/prefill-inspection/index.ts` | Erik |
| `supabase/functions/apply-voice-edits/index.ts` | Dynamiskt |
| `supabase/functions/parse-template-voice/index.ts` | Oscar |

---

### Resultat

Användaren får en personlig upplevelse där varje del av appen har sin egen AI-agent:

- **Offert**: "Låt Saga AI hjälpa dig att skapa kalkylen"
- **Planering**: "Låt Bo AI planera ditt projekt"
- **Dagrapport**: "Låt Ulla AI dokumentera din dag"
- **Egenkontroll**: "Låt Erik AI fylla i kontrollen"
- **Arbetsorder/ÄTA**: "Låt Märta AI skapa dokumentet"

