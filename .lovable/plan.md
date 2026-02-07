

## Mål

Konsolidera alla AI-agenter (Saga, Bo, Ulla) till ett enda varumärke: **Byggio AI**. Byt även "Assistent" i sidomenyn till "Byggio AI".

---

## Nuvarande vs Önskat

| Element | Nuvarande | Efter ändring |
|---------|-----------|---------------|
| Sidomenyn | "Assistent" | "Byggio AI" |
| AI-agenter | Saga, Bo, Ulla (3 st) | Byggio AI (1 st) |
| Landing page | "Möt dina AI-kollegor" med 3 agenter | Ta bort sektionen eller ersätt med Byggio AI |
| Agent-detaljsidor | /ai/saga, /ai/bo, /ai/ulla | Ta bort |
| Röstinspelning-prompts | "Låt Saga/Bo/Ulla AI hjälpa dig" | "Låt Byggio AI hjälpa dig" |
| AgentChatBubble | Saga/Bo chat-bubblor | Byggio AI (eller ta bort) |

---

## Ändringar

### 1. Sidomeny - Byt "Assistent" till "Byggio AI"

**Fil:** `src/components/layout/AppLayout.tsx`

```text
Rad 64:
FÖRE: { label: "Assistent", href: "/global-assistant", icon: Sparkles, moduleKey: "dashboard" },
EFTER: { label: "Byggio AI", href: "/global-assistant", icon: Sparkles, moduleKey: "dashboard" },
```

### 2. AI-agenter konfiguration - Ersätt med Byggio AI

**Fil:** `src/config/aiAgents.ts`

Ersätt alla tre agenter med en enda "byggio" agent:

```typescript
import byggioLogo from "@/assets/byggio-logo.png";

export const AI_AGENTS = {
  byggio: {
    name: "Byggio AI",
    title: "Din AI-assistent",
    description: "Din kompletta assistent för byggprojekt",
    promptIntro: "Du är Byggio AI, en expert-assistent för svenska byggföretag.",
    avatar: byggioLogo,
  },
  // Behåll alias för bakåtkompatibilitet
  estimate: { ... }, // peka på byggio
  planning: { ... }, // peka på byggio
  diary: { ... },    // peka på byggio
} as const;
```

### 3. Landing page - Ta bort/uppdatera agent-sektionen

**Filer att uppdatera:**
- `src/components/landing/AIAgentsSection.tsx` → Ta bort eller gör om till en sektion om Byggio AI
- `src/pages/ai/AgentDetail.tsx` → Ta bort eller omdirigera till /global-assistant

### 4. Röstinspelning-prompts - Byt agentnamn

**Filer att uppdatera:**

| Fil | Ändring |
|-----|---------|
| `src/components/estimates/EstimateBuilder.tsx` | "Låt Saga AI hjälpa dig" → "Låt Byggio AI hjälpa dig" |
| `src/components/projects/ProjectPlanningTab.tsx` | "Låt Bo AI hjälpa dig" → "Låt Byggio AI hjälpa dig" |
| `src/components/projects/InlineDiaryCreator.tsx` | "Låt Ulla AI hjälpa dig" → "Låt Byggio AI hjälpa dig" |
| `src/components/planning/PlanEditor.tsx` | "Låt Bo AI hjälpa dig" → "Låt Byggio AI hjälpa dig" |
| Alla `agentName` props | "Saga AI"/"Bo AI"/"Ulla AI" → "Byggio AI" |

### 5. AgentChatBubble - Byt till Byggio AI

**Fil:** `src/components/shared/AgentChatBubble.tsx`

Byt ut agent-konfigurationen till att använda Byggio AI istället för Saga/Bo.

### 6. Voice recorder - Uppdatera agentnamn

**Filer:**
- `src/pages/Planning.tsx` → agentName: "Bo" → "Byggio AI"
- `src/components/projects/InlineDiaryCreator.tsx` → agentName: "Ulla" → "Byggio AI"
- `src/components/projects/ProjectPlanningTab.tsx` → agentName: "Bo" → "Byggio AI"

### 7. Backend agent-chat funktion (valfritt)

**Fil:** `supabase/functions/agent-chat/index.ts`

Uppdatera system prompts för att referera till Byggio AI istället för individuella agenter.

---

## Filer att ändra (prioritetsordning)

| # | Fil | Ändring |
|---|-----|---------|
| 1 | `src/components/layout/AppLayout.tsx` | "Assistent" → "Byggio AI" |
| 2 | `src/config/aiAgents.ts` | Konsolidera till Byggio AI |
| 3 | `src/components/estimates/EstimateBuilder.tsx` | Saga → Byggio AI |
| 4 | `src/components/projects/ProjectPlanningTab.tsx` | Bo → Byggio AI |
| 5 | `src/components/projects/InlineDiaryCreator.tsx` | Ulla → Byggio AI |
| 6 | `src/components/planning/PlanEditor.tsx` | Bo → Byggio AI |
| 7 | `src/components/shared/AgentChatBubble.tsx` | Saga/Bo → Byggio AI |
| 8 | `src/components/reports/ReportEditor.tsx` | Ulla → Byggio AI |
| 9 | `src/components/projects/ProjectAtaTab.tsx` | Ulla → Byggio AI |
| 10 | `src/components/projects/ProjectWorkOrdersTab.tsx` | Ulla → Byggio AI |
| 11 | `src/components/estimates/EstimateSummary.tsx` | Saga → Byggio AI |
| 12 | `src/pages/InspectionView.tsx` | Ulla → Byggio AI |
| 13 | `src/pages/Planning.tsx` | Bo → Byggio AI |
| 14 | `src/components/landing/AIAgentsSection.tsx` | Ta bort sektionen eller gör om |
| 15 | `src/pages/ai/AgentDetail.tsx` | Ta bort eller omdirigera |
| 16 | `supabase/functions/agent-chat/index.ts` | Uppdatera prompts |

---

## Beslutspunkter

Behöver avklara med dig:

1. **Landing page sektionen "Möt dina AI-kollegor"** - ska den:
   - a) Tas bort helt?
   - b) Göras om till en sektion om Byggio AI?

2. **Agent-detaljsidorna (/ai/saga, /ai/bo, /ai/ulla)** - ska de:
   - a) Tas bort helt?
   - b) Omdirigeras till /global-assistant?

---

## Resultat

1. Sidomeny visar "Byggio AI" istället för "Assistent"
2. Alla röstinspelningsprompts säger "Låt Byggio AI hjälpa dig"
3. Ett enhetligt AI-varumärke genom hela appen
4. Enklare kommunikation mot användare - en AI istället för tre

