

## Plan: Ta bort temperature-parametern

### Problem identifierat

| Fel | Orsak | Plats |
|-----|-------|-------|
| `AI API error: 400` | `temperature: 0.7` stöds inte av modellen | Rad 242 i `agent-chat/index.ts` |

API-felet:
```json
{
  "message": "Unsupported value: 'temperature' does not support 0.7 with this model. Only the default (1) value is supported."
}
```

---

## Teknisk ändring

### Fil: `supabase/functions/agent-chat/index.ts`

**Rad 239-244 - Ta bort temperature:**

```typescript
// FEL (nuvarande kod):
body: JSON.stringify({
  model: "openai/gpt-5-mini",
  messages: apiMessages,
  temperature: 0.7,                  // <-- DENNA RAD ORSAKAR FELET
  max_completion_tokens: 1000,
}),

// RÄTT (fix):
body: JSON.stringify({
  model: "openai/gpt-5-mini",
  messages: apiMessages,
  max_completion_tokens: 1000,       // Ta bort temperature helt
}),
```

---

## Sammanfattning

| Ändring | Beskrivning |
|---------|-------------|
| Ta bort `temperature: 0.7` | Modellen stöder endast default temperature (1) |

Efter denna ändring kommer Saga och Bo att fungera korrekt.

