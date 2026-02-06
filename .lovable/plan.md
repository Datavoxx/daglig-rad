
# Plan: Fixa context-timing bug i Global Assistant

## Problem

När användaren väljer en offert i verifikationskortet:
1. `handleVerificationSelect` uppdaterar context med `setContext({ selectedEstimateId: match.id })`
2. `sendMessage` anropas direkt efter med texten "Ja, det är tony-test"
3. **Men React state är asynkront** - `context` är fortfarande tom när anropet sker
4. Edge-funktionen får `Context: {}` och AI:n tolkar "tony-test" som ID istället för UUID

## Lösning

Ändra `sendMessage` så den accepterar en **override-context** som parameter. På så sätt kan vi skicka med den nya kontexten direkt utan att vänta på React-rendering.

## Teknisk implementation

### Ändring i GlobalAssistant.tsx

```typescript
// FÖRE:
const sendMessage = async (content: string) => {
  // ...
  await supabase.functions.invoke("global-assistant", {
    body: { message: content, history, context }
  });
};

// EFTER:
const sendMessage = async (content: string, contextOverride?: Partial<ConversationContext>) => {
  const effectiveContext = contextOverride 
    ? { ...context, ...contextOverride } 
    : context;
  
  // ...
  await supabase.functions.invoke("global-assistant", {
    body: { message: content, history, context: effectiveContext }
  });
};

// Uppdatera handleVerificationSelect:
const handleVerificationSelect = async (messageId: string, match: VerificationMatch) => {
  const message = messages.find((m) => m.id === messageId);
  let newContext: Partial<ConversationContext> = {};
  
  if (message?.data?.entityType === "customer") {
    newContext = { selectedCustomerId: match.id };
  } else if (message?.data?.entityType === "project") {
    newContext = { selectedProjectId: match.id };
  } else if (message?.data?.entityType === "estimate") {
    newContext = { selectedEstimateId: match.id };
  } else if (message?.data?.entityType === "invoice") {
    newContext = { selectedInvoiceId: match.id };
  } else if (message?.data?.entityType === "inspection") {
    newContext = { selectedInspectionId: match.id };
  }
  
  // Update local state for future messages
  setContext((prev) => ({ ...prev, ...newContext }));
  
  // Send with the new context immediately (bypass React async)
  await sendMessage(`Ja, det är ${match.title}`, newContext);
};
```

## Fil att ändra

| Fil | Ändring |
|-----|---------|
| `src/pages/GlobalAssistant.tsx` | Lägg till contextOverride-parameter i sendMessage och använd i handleVerificationSelect |

## Resultat

| Före | Efter |
|------|-------|
| Edge-funktionen får `Context: {}` | Edge-funktionen får `Context: { selectedEstimateId: "e284148f-..." }` |
| AI:n tolkar "tony-test" som ID | AI:n använder rätt UUID från context |
| Fel: "invalid input syntax for type uuid" | Offerten hämtas och visas korrekt |
