

## Plan: Fixa API-parameterfel i agent-chat

### Problem identifierat

| Fel | Orsak | Plats |
|-----|-------|-------|
| `AI API error: 400` | Fel parameter: `max_tokens` stöds inte | Rad 243 i `agent-chat/index.ts` |

API:et returnerar:
```json
{
  "error": {
    "message": "Unsupported parameter: 'max_tokens' is not supported with this model. Use 'max_completion_tokens' instead.",
    "type": "invalid_request_error"
  }
}
```

---

## Teknisk ändring

### Fil: `supabase/functions/agent-chat/index.ts`

**Rad 239-244 - Ändra parametern:**

```typescript
// FEL (nuvarande kod):
body: JSON.stringify({
  model: "openai/gpt-5-mini",
  messages: apiMessages,
  temperature: 0.7,
  max_tokens: 1000,   // <-- FEL PARAMETER
}),

// RÄTT (fix):
body: JSON.stringify({
  model: "openai/gpt-5-mini",
  messages: apiMessages,
  temperature: 0.7,
  max_completion_tokens: 1000,   // <-- RÄTT PARAMETER
}),
```

---

## Sammanfattning

| Ändring | Beskrivning |
|---------|-------------|
| `max_tokens` → `max_completion_tokens` | OpenAI/GPT-5-modeller kräver den nya parametern |

Efter denna ändring kommer Saga och Bo att kunna svara på frågor korrekt.

