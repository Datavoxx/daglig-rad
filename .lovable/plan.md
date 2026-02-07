

# Plan: Säkerställ konsekventa formulär i Byggio AI

## Sammanfattning

Du vill att Byggio AI **alltid** visar interaktiva formulär (kort) istället för textfrågor för dessa åtgärder:
1. Skapa offert
2. Skapa projekt
3. Sök kund
4. Ny kund
5. Ny dagrapport
6. Registrera tid
7. Visa fakturor
8. Checka in

Problemet idag är att AI:n ibland visar formulär och ibland ställer textfrågor - detta är inkonsekvent.

## Teknisk lösning

### Del 1: Stärkt systemprompt (hårdare regler)

Lägg till en ny sektion i systemprompt som **förbjuder** AI:n från att ställa textfrågor:

```text
═══════════════════════════════════════════════════════════════════════════════
STRIKT REGEL: ALLTID FORMULÄR - ALDRIG TEXTFRÅGOR!
═══════════════════════════════════════════════════════════════════════════════

Du får ALDRIG svara med textfrågor om du kan visa ett formulär istället.

FÖRBJUDNA SVAR (GÖR ALDRIG DETTA):
- "Vilken kund gäller offerten?"
- "Vilket projekt vill du registrera tid på?"
- "Kan du berätta vilken kund..."
- "För att skapa en offert behöver jag veta..."

ISTÄLLET - ANROPA ALLTID DESSA VERKTYG:
| Användarens intent | Verktyg att anropa |
|-------------------|-------------------|
| "skapa offert", "ny offert" | get_customers_for_estimate |
| "skapa projekt", "nytt projekt" | get_project_form |
| "sök kund", "visa kunder" | get_all_customers |
| "ny kund", "lägg till kund" | get_customer_form |
| "ny dagrapport", "skapa rapport" | get_projects_for_daily_report |
| "registrera tid", "logga tid" | get_active_projects_for_time |
| "visa fakturor", "mina fakturor" | get_invoice_filter_form |
| "checka in", "stämpla in" | get_projects_for_check_in |

DETTA ÄR ETT ABSOLUT KRAV - INGA UNDANTAG!
```

### Del 2: Lägg till saknade verktyg

Vi saknar två verktyg:

**1. `get_invoice_filter_form`** - visar faktura-filter (status, kund)

```typescript
{
  type: "function",
  function: {
    name: "get_invoice_filter_form",
    description: "Show invoice filter form. Use when user wants to view/search invoices.",
    parameters: { type: "object", properties: {}, required: [] },
  },
}
```

**2. `get_projects_for_check_in`** - visar projekt att checka in på

```typescript
{
  type: "function",
  function: {
    name: "get_projects_for_check_in",
    description: "Get active projects for check-in. Use when user wants to check in without specifying project.",
    parameters: { type: "object", properties: {}, required: [] },
  },
}
```

### Del 3: Lägg till frontend-komponenter

**1. Ny meddelandetyp `check_in_form`**
- Lägg till i `types/global-assistant.ts`
- Visa projektlista med "Checka in"-knapp

**2. Ny meddelandetyp `invoice_filter_form`**
- Lägg till i `types/global-assistant.ts`
- Visa filter (status: alla/utkast/skickade/betalda)

### Del 4: Backend fallback (säkerhetsnät)

Om AI:n ändå svarar med text när den borde visa formulär, detektera detta och tvinga fram formulär:

```typescript
// Före textsvaret (rad ~3590)
const forceFormPatterns = [
  { pattern: /skapa (ny |en )?offert/i, tool: "get_customers_for_estimate" },
  { pattern: /(ny|skapa|nytt) projekt/i, tool: "get_project_form" },
  { pattern: /(sök|hitta|visa).*(kund|kunder)/i, tool: "get_all_customers" },
  { pattern: /(ny|skapa|lägg till).*(kund)/i, tool: "get_customer_form" },
  { pattern: /(skapa|ny).*(dag)?rapport/i, tool: "get_projects_for_daily_report" },
  { pattern: /registrera.*tid|logga.*tid|rapportera.*timmar/i, tool: "get_active_projects_for_time" },
  { pattern: /visa.*faktur|mina.*faktur/i, tool: "get_invoice_filter_form" },
  { pattern: /checka? in|stämpla in/i, tool: "get_projects_for_check_in" },
];

const lowerMessage = message.toLowerCase();
for (const { pattern, tool } of forceFormPatterns) {
  if (pattern.test(lowerMessage)) {
    // Kör verktyget och returnera formulär
    const toolResult = await executeTool(supabase, userId, tool, {});
    return formatToolResults(tool, toolResult);
  }
}
```

## Filer att ändra

| Fil | Ändring |
|-----|---------|
| `supabase/functions/global-assistant/index.ts` | 1. Stärkt systemprompt |
| | 2. Nya verktyg: `get_invoice_filter_form`, `get_projects_for_check_in` |
| | 3. Verktygsimplementationer i `executeTool` |
| | 4. Formattering i `formatToolResults` |
| | 5. Fallback-logik före textsvar |
| `src/types/global-assistant.ts` | Lägg till `check_in_form` och `invoice_filter_form` typer |
| `src/components/global-assistant/MessageList.tsx` | Rendera nya kort-typer |
| `src/components/global-assistant/CheckInFormCard.tsx` | **NY FIL** - projektlista med checka-in knapp |
| `src/components/global-assistant/InvoiceFilterCard.tsx` | **NY FIL** - fakturafilter |
| `src/pages/GlobalAssistant.tsx` | Hantera submit/cancel för nya formulär |

## Resultat

| Före | Efter |
|------|-------|
| "Skapa offert" → Text "Vilken kund?" (ibland) | "Skapa offert" → Formulär (alltid) |
| "Registrera tid" → Text (ibland) | "Registrera tid" → Formulär (alltid) |
| "Visa fakturor" → Lista (inkonsekvent) | "Visa fakturor" → Filterformulär |
| "Checka in" → Text "Vilket projekt?" | "Checka in" → Projektformulär |

