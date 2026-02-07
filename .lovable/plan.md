
# Plan: Optimera Byggio AI för GPT-5-mini

## Sammanfattning av problem

1. **AI:n tar inte rätt kontext** - "kan du skapa arbetsorder på projekt Tony Test" borde direkt visa arbetsorderformuläret, inte söka projektet
2. **Svaren är för långa** - AI:n skriver för mycket text
3. **Prompten är Gemini-optimerad** - behöver skrivas om för GPT-5 enligt OpenAIs Cookbook
4. **Saknas arbetsorderformulär** - ingen interaktiv UI för att skapa arbetsorder

## Teknisk lösning

### 1. Skriv om systemprompt enligt GPT-5 Cookbook

Enligt OpenAIs dokumentation ska GPT-5-prompts:
- Vara kortare och mer koncisa (GPT-5 förstår instruktioner bättre)
- Använda XML-taggar för struktur
- Ha tydlig `<brevity>` sektion för att styra svarslängd
- Inte ha överdrivna uppmaningar om att "vara hjälpsam" (det vet modellen redan)

**Ny prompt-struktur:**
```text
<role>
Du är Byggio AI - en effektiv assistent för byggföretag.
</role>

<brevity>
- Ge korta, koncisa svar - max 2-3 meningar
- Använd verktyg direkt istället för att förklara vad du ska göra
- Undvik inledande fraser som "Jag ska hjälpa dig med..."
- Visa formulär omedelbart när det behövs
</brevity>

<intent_detection>
NÄR ANVÄNDAREN NÄMNER ETT PROJEKTNAMN - förstå KONTEXTEN:
- "ekonomi på projekt X" → Hämta ekonomi för projektet
- "arbetsorder på projekt X" → Visa arbetsorderformulär
- "visa projekt X" → Hämta projektet

Projektnamnet är INTE instruktionen - det är parametern!
</intent_detection>

<form_policy>
ANVÄND ALLTID FORMULÄR för dessa åtgärder:
- skapa arbetsorder → get_projects_for_work_order
- skapa offert → get_customers_for_estimate
- registrera tid → get_active_projects_for_time
...
</form_policy>
```

### 2. Lägg till arbetsorderformulär

**Nytt verktyg:**
```typescript
{
  name: "get_projects_for_work_order",
  description: "Get active projects for work order form. Use when user wants to create a work order."
}
```

**Ny frontend-komponent:** `WorkOrderFormCard.tsx`
- Dropdown för projekt (om inget valt i kontext)
- Fält för titel (obligatoriskt)
- Fält för beskrivning (valfritt)
- Fält för tilldelning (valfritt, lista anställda)
- Fält för förfallodatum (valfritt)
- "Skapa arbetsorder"-knapp

### 3. Fix för kontextförståelse

Problemet är att när användaren säger "skapa arbetsorder på projekt Tony Test" så:
1. AI:n anropar `search_projects` med "Tony Test"
2. Visar projektet
3. Användaren måste säga igen vad den vill

**Lösning:** Uppdatera prompten med explicit intent-prioritering:

```text
<intent_priority>
VIKTIGT: Förstå användarens HUVUDINTENT först!

Exempel på korrekt tolkning:
- "visa ekonomin för projekt Solvik" 
  → INTENT: ekonomi | PARAM: Solvik
  → Anropa: get_project_economy (sök upp Solvik-ID först)

- "skapa arbetsorder på tony-test"
  → INTENT: arbetsorder | PARAM: tony-test
  → Anropa: get_projects_for_work_order ELLER create_work_order

- "berätta om projektet tony-test"
  → INTENT: visa projekt | PARAM: tony-test
  → Anropa: get_project

ALDRIG visa projektet om användaren frågade om ekonomi, arbetsorder, etc.
</intent_priority>
```

### 4. Lägg till fallback-logik (säkerhetsnät)

Om AI:n ändå svarar med text istället för formulär:

```typescript
// Före textsvaret
const forceFormPatterns = [
  { pattern: /skapa.*(arbetsorder|wo)/i, tool: "get_projects_for_work_order" },
  { pattern: /(ekonomi|budget).*(projekt|på)/i, tool: "get_project_economy" },
  // ... etc
];

for (const { pattern, tool } of forceFormPatterns) {
  if (pattern.test(message)) {
    const toolResult = await executeTool(supabase, userId, tool, {});
    return formatToolResults(tool, toolResult);
  }
}
```

## Filer att ändra

| Fil | Ändring |
|-----|---------|
| `supabase/functions/global-assistant/index.ts` | 1. Skriv om systemprompt för GPT-5 |
| | 2. Lägg till `get_projects_for_work_order` verktyg |
| | 3. Implementera verktyget i `executeTool` |
| | 4. Formatera resultat i `formatToolResults` |
| | 5. Lägg till fallback-logik |
| `src/types/global-assistant.ts` | Lägg till `work_order_form` meddelandetyp |
| `src/components/global-assistant/WorkOrderFormCard.tsx` | **NY FIL** - formulär för arbetsorder |
| `src/components/global-assistant/MessageList.tsx` | Rendera `WorkOrderFormCard` |
| `src/pages/GlobalAssistant.tsx` | Hantera submit/cancel för arbetsorder |

## Förändring i systemprompt

**Före (1000+ ord):**
```
Du är Byggio AI - en avancerad och kunnig AI-assistent...
DU ÄR EN "KNOW-IT-ALL" AGENT...
[massor av text om alla funktioner]
GE INFORMATIVA SVAR...
[mer text]
```

**Efter (~400 ord):**
```xml
<role>
Du är Byggio AI - effektiv assistent för byggföretag.
</role>

<brevity>
- Max 2-3 meningar per svar
- Visa formulär direkt, förklara inte
- Inga inledande fraser
</brevity>

<intent_detection>
Projektnamn är PARAMETER, inte instruktion:
- "ekonomi för X" → get_project_economy
- "arbetsorder på X" → get_projects_for_work_order
</intent_detection>

<context>
Projekt-ID: ${context?.selectedProjectId || 'inget'}
Kund-ID: ${context?.selectedCustomerId || 'inget'}
→ Använd dessa automatiskt!
</context>

<form_policy>
Visa formulär för: offert, projekt, tid, dagrapport, arbetsorder, kund, incheckning
</form_policy>
```

## Förväntat resultat

| Meddelande | Före | Efter |
|------------|------|-------|
| "ekonomi på tony-test" | Visar projekt | Visar ekonomiöversikt |
| "skapa arbetsorder på tony-test" | Visar projekt + lång text | Arbetsorderformulär |
| "skapa offert" | (Ibland) text | Alltid formulär |
| Alla svar | 5-10 meningar | 1-3 meningar |
