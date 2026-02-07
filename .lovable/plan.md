

## Mål

Fixa felet "AI-tjänsten är inte konfigurerad" i röstinspelningsfunktionen för formulär genom att byta från OpenRouter till Lovable AI Gateway.

---

## Problem

Edge-funktionen `extract-form-data` skapades med fel AI-integration:
- **Nuvarande**: Använder `OPENROUTER_API_KEY` och `https://openrouter.ai/api/v1/chat/completions`
- **Korrekt**: Bör använda `LOVABLE_API_KEY` och `https://ai.gateway.lovable.dev/v1/chat/completions`

`LOVABLE_API_KEY` finns redan konfigurerad och fungerar i alla andra edge-funktioner (generate-report, global-assistant, etc.).

---

## Ändringar

### Fil: `supabase/functions/extract-form-data/index.ts`

| Rad | Nuvarande | Nytt |
|-----|-----------|------|
| 132 | `const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");` | `const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");` |
| 134 | `if (!openRouterApiKey)` | `if (!LOVABLE_API_KEY)` |
| 142 | `https://openrouter.ai/api/v1/chat/completions` | `https://ai.gateway.lovable.dev/v1/chat/completions` |
| 145 | `"Authorization": \`Bearer ${openRouterApiKey}\`` | `"Authorization": \`Bearer ${LOVABLE_API_KEY}\`` |
| 146-147 | Ta bort `"HTTP-Referer"` och `"X-Title"` headers | Behövs ej för Lovable AI |

---

## Tekniska detaljer

Lovable AI Gateway-format (samma som `generate-report` använder):

```typescript
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "google/gemini-2.5-flash",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Transkript: "${transcript}"` },
    ],
    temperature: 0.1,
    // Obs: response_format stöds ej av Lovable AI - ta bort det
  }),
});
```

---

## Filer att ändra

| # | Fil | Ändring |
|---|-----|---------|
| 1 | `supabase/functions/extract-form-data/index.ts` | Byt från OpenRouter till Lovable AI Gateway |

---

## Resultat

- Röstinspelning i formulär kommer att fungera korrekt
- AI:n extraherar data från transkriptionen och fyller i formuläret automatiskt
- Använder samma AI-tjänst som resten av applikationen

