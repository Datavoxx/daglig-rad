

## Plan: AI-chattbubbla för Saga (Offert) och Bo (Projekt)

### Översikt
Skapa interaktiva chattbubblor i nedre vänstra hörnet av skärmen för att prata med AI-agenterna. Saga hanterar offertfrågor och Bo hanterar projektfrågor (inklusive Ullas dokumentationsdomän).

---

## Teknisk arkitektur

```text
┌─────────────────────────────────────────────────────────────────┐
│                          FRONTEND                                │
├─────────────────────────────────────────────────────────────────┤
│  AgentChatBubble.tsx (ny komponent)                             │
│  ├── Floating button (nedre vänster)                            │
│  ├── Chat panel med animation (slide-in + fade)                 │
│  ├── Message history + streaming response                       │
│  └── Agent avatar + personlighet                                │
├─────────────────────────────────────────────────────────────────┤
│                          BACKEND                                 │
├─────────────────────────────────────────────────────────────────┤
│  supabase/functions/agent-chat/index.ts (ny edge function)      │
│  ├── Streaming SSE response                                     │
│  ├── Saga: full offertkontext (items, scope, assumptions, etc)  │
│  └── Bo: full projektkontext (faser, dagbok, ÄTA, arbetsorder) │
└─────────────────────────────────────────────────────────────────┘
```

---

## Filer att skapa

### 1. `src/components/shared/AgentChatBubble.tsx` (ny fil)

En återanvändbar chattbubbla-komponent med följande funktioner:

**Props:**
```typescript
interface AgentChatBubbleProps {
  agent: "saga" | "bo";
  context: SagaContext | BoContext;
}

interface SagaContext {
  projectName: string;
  clientName: string;
  scope: string;
  assumptions: string[];
  items: EstimateItem[];
  addons: EstimateAddon[];
  rotEnabled: boolean;
  markupPercent: number;
  totals: { laborCost: number; materialCost: number; subcontractorCost: number; grandTotal: number };
}

interface BoContext {
  projectId: string;
  projectName: string;
  clientName?: string;
  status?: string;
  // Planering
  phases?: PlanPhase[];
  totalWeeks?: number;
  // Dagbok (Ulla's domain - Bo kan besvara)
  recentDiaryEntries?: DiaryEntry[];
  // ÄTA
  ataItems?: AtaItem[];
  // Arbetsorder
  workOrders?: WorkOrder[];
}
```

**UI-design:**
- Floating button i nedre vänstra hörnet (ej i vägen för navigation)
- Klick öppnar en chattpanel med snygg animation (slide-in från vänster + fade)
- Agentens avatar visas i panelens header
- Meddelandehistorik med bubblor (användare höger, agent vänster)
- Streaming-svar visas token för token
- Stäng-knapp + möjlighet att minimera

**Animationer (Tailwind + CSS):**
```css
/* Öppna chatten */
.chat-panel-enter {
  animation: slideInLeft 0.3s ease-out, fadeIn 0.2s ease-out;
}

/* Stäng chatten */
.chat-panel-exit {
  animation: slideOutLeft 0.2s ease-in, fadeOut 0.15s ease-in;
}
```

### 2. `supabase/functions/agent-chat/index.ts` (ny edge function)

**Streaming SSE-baserad chattfunktion:**

```typescript
// Saga's system prompt fokus:
// - Full kunskap om offertstruktur
// - Kan förklara ROT/RUT-beräkningar
// - Kan svara på frågor om specifika poster
// - Kan ge rekommendationer baserat på kontext

// Bo's system prompt fokus:
// - Full kunskap om projektplanering (faser, tidslinjer)
// - Kan svara på Ullas domän: dagrapporter, ÄTA, arbetsorder
// - Kan förklara projektets status och nästa steg
// - Kan ge rekommendationer för tidsplanen
```

**Request body:**
```typescript
{
  agent: "saga" | "bo",
  messages: Array<{ role: "user" | "assistant", content: string }>,
  context: SagaContext | BoContext
}
```

**Response:** SSE-stream med token-by-token text

---

## Filer att uppdatera

### 3. `src/components/estimates/EstimateBuilder.tsx`

Lägg till AgentChatBubble med Saga:

```typescript
import { AgentChatBubble } from "@/components/shared/AgentChatBubble";

// I komponenten, efter allt annat innehåll:
<AgentChatBubble 
  agent="saga"
  context={{
    projectName: displayProjectName,
    clientName: displayClientName,
    scope: estimate.state.scope,
    assumptions: estimate.state.assumptions,
    items: estimate.state.items,
    addons: estimate.state.addons,
    rotEnabled: estimate.state.rotEnabled,
    markupPercent: estimate.state.markupPercent,
    totals: estimate.totals,
  }}
/>
```

### 4. `src/pages/ProjectView.tsx`

Lägg till AgentChatBubble med Bo:

```typescript
import { AgentChatBubble } from "@/components/shared/AgentChatBubble";

// I komponenten, efter Tabs:
<AgentChatBubble 
  agent="bo"
  context={{
    projectId: project.id,
    projectName: project.name,
    clientName: project.client_name,
    status: project.status,
    // Dessa kan hämtas dynamiskt via queries
  }}
/>
```

### 5. `supabase/config.toml`

Lägg till konfiguration för nya edge function:

```toml
[functions.agent-chat]
verify_jwt = false
```

---

## UI-design detaljer

### Chattbubbla (stängd)
```text
┌─────────┐
│  [👤]   │  ← Agent avatar (Saga eller Bo)
│ Fråga   │  ← Kort label
└─────────┘
Position: fixed, bottom-6, left-6
```

### Chattpanel (öppen)
```text
┌────────────────────────────────────────┐
│ [Avatar] Saga                     [X]  │  ← Header
├────────────────────────────────────────┤
│                                        │
│  ┌──────────────────────────────┐     │
│  │ Hej! Jag är Saga, din        │     │  ← Agent intro
│  │ kalkylexpert. Ställ frågor   │     │
│  │ om offerten!                 │     │
│  └──────────────────────────────┘     │
│                                        │
│         ┌──────────────────────┐      │
│         │ Vad är totalsumman?  │      │  ← Användare
│         └──────────────────────┘      │
│                                        │
│  ┌──────────────────────────────┐     │
│  │ Totalsumman är 125 000 kr   │     │  ← Saga svarar
│  │ inklusive ROT-avdrag...     │     │
│  └──────────────────────────────┘     │
│                                        │
├────────────────────────────────────────┤
│ [Skriv ditt meddelande...]    [Skicka]│  ← Input
└────────────────────────────────────────┘
Position: fixed, bottom-6, left-6
Storlek: w-80 h-[500px] (max)
```

---

## System prompts

### Saga (Offert)
```
Du heter Saga och är en expert på offerter och kalkyler för byggprojekt i Sverige.

Du har full tillgång till den aktuella offerten som användaren arbetar med. Du kan:
- Förklara vilka poster som ingår och deras kostnader
- Berätta om ROT/RUT-avdrag och hur de påverkar slutpriset
- Ge rekommendationer om prissättning
- Svara på frågor om projektets omfattning
- Hjälpa till att förklara offerten för kunden

Var hjälpsam, professionell och koncis. Svara alltid på svenska.

AKTUELL OFFERT:
[Kontextdata injiceras här]
```

### Bo (Projekt)
```
Du heter Bo och är en expert på byggprojektplanering och dokumentation.

Du har full tillgång till det aktuella projektet. Du kan:
- Förklara projektets tidplan och faser
- Svara på frågor om dagrapporter och dokumentation (Ullas område)
- Ge information om ÄTA-ärenden
- Förklara arbetsorder och deras status
- Ge rekommendationer för projektets nästa steg

Var hjälpsam, professionell och koncis. Svara alltid på svenska.

AKTUELLT PROJEKT:
[Kontextdata injiceras här]
```

---

## Sammanfattning

| Fil | Typ | Beskrivning |
|-----|-----|-------------|
| `src/components/shared/AgentChatBubble.tsx` | Ny | Återanvändbar chattbubbla med animationer |
| `supabase/functions/agent-chat/index.ts` | Ny | Streaming edge function för båda agenter |
| `src/components/estimates/EstimateBuilder.tsx` | Uppdatera | Lägg till Saga chattbubbla |
| `src/pages/ProjectView.tsx` | Uppdatera | Lägg till Bo chattbubbla |
| `supabase/config.toml` | Uppdatera | Registrera agent-chat function |

### Nyckelfunktioner
- Streaming-svar (token-by-token) för responsiv UX
- Animationer vid öppna/stäng (slide-in från vänster)
- Full kontextmedvetenhet för båda agenterna
- Bo kan besvara frågor om Ullas domän (dokumentation)
- Positionerad i nedre vänstra hörnet (ej i konflikt med befintlig VoiceInputOverlay som är höger)

