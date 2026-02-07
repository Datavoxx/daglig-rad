
# Plan: Fixa offert-loop + Tvåstegs-output

## Sammanfattning av problem

1. **Buggen**: När du klickar "Skapa offert" i formuläret skickas meddelandet `Skapa offert "X" för kund med ID Y`, men AI:n anropar `get_customers_for_estimate` (formuläret) istället för `create_estimate`
2. **Önskat flöde**: Efter skapande ska det komma BÅDE bekräftelse OCH items-formuläret direkt

## Lösning: Tvådelad

### Del 1: Fixa loopen med Direct Pattern Matching

Lägg till pattern-matching i edge function som fångar upp meddelanden med kund-ID och kör `create_estimate` direkt - utan att gå via AI:n:

```typescript
// FÖRE AI-anropet
const directCreateEstimate = /(?:skapa|create)\s*offert\s*"([^"]+)".*(?:kund med ID|customer_id)[=:\s]*([a-f0-9-]{36})/i;
const match = message.match(directCreateEstimate);

if (match) {
  const [, title, customerId] = match;
  const address = message.match(/(?:på adress|address)\s+(.+?)(?:\s+för|\s*$)/i)?.[1] || "";
  
  // Kör create_estimate direkt!
  const result = await executeTool(supabase, userId, "create_estimate", {
    customer_id: customerId,
    title: title.trim(),
    address: address.trim(),
  });
  
  return formatToolResults("create_estimate", result);
}
```

### Del 2: Tvåstegs-output (bekräftelse + formulär)

Uppdatera `formatToolResults` för `create_estimate` att returnera ett svar som frontend tolkar som två delar:

**Nuvarande output:**
```typescript
return {
  type: "estimate_items_form",
  content: "Offert OFF-2026-0032 skapad! Lägg till offertposter nedan.",
  data: { estimateId, offerNumber },
};
```

**Ny approach - returnera result-typ med inbäddad form:**

```typescript
return {
  type: "result_with_form",  // Ny typ!
  content: "",
  data: {
    success: true,
    resultMessage: `Offert ${estimate.offer_number} skapad!`,
    link: {
      label: "Öppna offert",
      href: `/estimates?estimateId=${estimate.id}`,
    },
    // Inbäddad form-data
    nextForm: {
      type: "estimate_items_form",
      estimateId: estimate.id,
      offerNumber: estimate.offer_number,
    },
  },
  context: {
    selectedEstimateId: estimate.id,
  },
};
```

Alternativt (enklare approach) - låt frontend rendera BÅDE ResultCard OCH EstimateItemsFormCard för typen `estimate_items_form`:

```typescript
// I MessageList.tsx
{message.type === "estimate_items_form" && (
  <>
    {/* Bekräftelse först */}
    <ResultCard 
      success={true}
      message={message.content}
      link={{ label: "Öppna offert", href: `/estimates?estimateId=${message.data?.estimateId}` }}
    />
    {/* Sen formuläret */}
    <EstimateItemsFormCard
      estimateId={message.data?.estimateId || ""}
      offerNumber={message.data?.offerNumber || ""}
      onSubmit={onEstimateItemsFormSubmit}
      onCancel={onEstimateItemsFormCancel}
      onOpenEstimate={() => onEstimateItemsFormOpen(message.data?.estimateId || "")}
    />
  </>
)}
```

---

## Filer att ändra

| Fil | Ändring |
|-----|---------|
| `supabase/functions/global-assistant/index.ts` | 1. Lägg till direct pattern matching för create_estimate |
| | 2. Lägg även till pattern för add_estimate_items |
| | 3. Uppdatera prompten med explicit regel: "kund-ID = create_estimate" |
| `src/components/global-assistant/MessageList.tsx` | 4. Rendera ResultCard INNAN EstimateItemsFormCard för typen `estimate_items_form` |

---

## Detaljerad implementation

### 1. Direct Pattern Matching (index.ts)

Lägg till efter CORS-hantering, före AI-anrop:

```typescript
// === DIRECT COMMAND PATTERNS ===
// Bypass AI when message contains all required data

// Pattern: Skapa offert "titel" för kund med ID uuid
const createEstimatePattern = /(?:skapa|create)\s*offert\s*["""]([^"""]+)["""].*(?:kund med ID|customer_id)[=:\s]*([a-f0-9-]{36})/i;
const createEstimateMatch = message.match(createEstimatePattern);

if (createEstimateMatch) {
  const [, title, customerId] = createEstimateMatch;
  const addressMatch = message.match(/(?:på adress|address)[=:\s]+(.+?)(?:\s+för|$)/i);
  const address = addressMatch?.[1]?.trim() || "";
  
  console.log("Direct create_estimate:", { title, customerId, address });
  
  const result = await executeTool(supabase, userId, "create_estimate", {
    customer_id: customerId,
    title: title.trim(),
    address,
  });
  
  const formatted = formatToolResults("create_estimate", result);
  return new Response(JSON.stringify(formatted), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Pattern: Lägg till poster på offert med ID uuid
const addItemsPattern = /(?:lägg till|add)\s*(?:poster|items).*(?:offert med ID|estimate_id)[=:\s]*([a-f0-9-]{36})/i;
const addItemsMatch = message.match(addItemsPattern);

if (addItemsMatch && context?.pendingData) {
  const estimateId = addItemsMatch[1] || context.selectedEstimateId;
  
  console.log("Direct add_estimate_items:", { estimateId, pendingData: context.pendingData });
  
  const result = await executeTool(supabase, userId, "add_estimate_items", {
    estimate_id: estimateId,
    ...context.pendingData,
  });
  
  const formatted = formatToolResults("add_estimate_items", result);
  return new Response(JSON.stringify(formatted), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```

### 2. Uppdatera Systemprompt (index.ts)

Lägg till explicit regel:

```text
<form_vs_create>
SKILLNAD MELLAN FORMULÄR OCH SKAPANDE:

VISA FORMULÄR (ingen data):
- "skapa offert" → get_customers_for_estimate

SKAPA DIREKT (data finns):
- "Skapa offert X för kund med ID Y" → create_estimate
- Om meddelandet innehåller UUID → använd create_* eller register_*

REGEL: Om kund-ID (UUID) finns i meddelandet → INTE formulär, SKAPA direkt!
</form_vs_create>
```

### 3. Tvådelad Rendering (MessageList.tsx)

Uppdatera renderingen av `estimate_items_form`:

```tsx
{message.type === "estimate_items_form" && (
  <div className="space-y-3">
    {/* Success banner */}
    <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3">
      <CheckCircle2 className="h-5 w-5 text-green-600" />
      <div className="flex-1">
        <p className="text-sm font-medium text-green-800 dark:text-green-200">
          {message.content || `Offert ${message.data?.offerNumber} skapad!`}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="text-green-700 hover:text-green-800"
        onClick={() => onEstimateItemsFormOpen(message.data?.estimateId || "")}
      >
        <ExternalLink className="h-4 w-4 mr-1" />
        Öppna
      </Button>
    </div>
    
    {/* Items form */}
    <EstimateItemsFormCard
      estimateId={message.data?.estimateId || ""}
      offerNumber={message.data?.offerNumber || ""}
      onSubmit={onEstimateItemsFormSubmit}
      onCancel={onEstimateItemsFormCancel}
      onOpenEstimate={() => onEstimateItemsFormOpen(message.data?.estimateId || "")}
    />
  </div>
)}
```

---

## Flöde efter fix

```text
1. Användaren: "Skapa offert"
   → AI: get_customers_for_estimate
   → Frontend: Visar EstimateFormCard

2. Användaren klickar "Skapa offert" i formuläret
   → Frontend skickar: 'Skapa offert "Renovering" för kund med ID abc-123'
   → Backend: Pattern match! Kör create_estimate direkt
   → Backend returnerar: estimate_items_form med estimateId

3. Frontend renderar:
   ┌──────────────────────────────────────┐
   │ ✓ Offert OFF-2026-0032 skapad!      │
   │                         [Öppna]     │
   └──────────────────────────────────────┘
   ┌──────────────────────────────────────┐
   │ Lägg till offertposter               │
   │ ┌──────────────────────────────────┐ │
   │ │ Projektbeskrivning              │ │
   │ └──────────────────────────────────┘ │
   │ ┌──────────────────────────────────┐ │
   │ │ Offertposter [+ Lägg till rad]  │ │
   │ └──────────────────────────────────┘ │
   │ ┌──────────────────────────────────┐ │
   │ │ Tillval [+ Lägg till]           │ │
   │ └──────────────────────────────────┘ │
   │         [Avbryt]  [Spara offert]    │
   └──────────────────────────────────────┘

4. Användaren fyller i och klickar "Spara offert"
   → Frontend skickar: 'Lägg till poster på offert med ID xyz...'
   → Backend: Pattern match! Kör add_estimate_items direkt
   → Backend returnerar: result med "Offert uppdaterad!"

5. Frontend renderar:
   ┌──────────────────────────────────────┐
   │ ✓ Offert OFF-2026-0032 uppdaterad   │
   │ med 3 poster!                        │
   │                         [Öppna]     │
   │                                      │
   │ [Visa offert] [Skapa ny offert]     │
   └──────────────────────────────────────┘
```

---

## Teknisk sammanfattning

| Problem | Lösning |
|---------|---------|
| AI anropar fel verktyg | Direct pattern matching före AI-anrop |
| Bara formulär visas, ingen bekräftelse | Tvådelad rendering: Success banner + Form |
| Loopen fortsätter | Pattern tar över INNAN AI får chansen |
