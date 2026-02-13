

## Korrigera AI-kostnadspriser till faktiska värden

### Bakgrund
De uppskattade priserna i admin-popupen var baserade på ungefärliga antaganden, inte verifierade mot leverantörernas faktiska priser. Efter att ha kollat tre källor (Lovable-dokumentationen, OpenAI:s officiella prislista och Google:s prislista) visade det sig att 5 av 6 priser var felaktiga.

Lovable-dokumentationen bekräftar: "The cost of using Lovable AI is exactly the same as going directly to the LLM provider."

### Korrigerade priser (per 1M tokens)

| Modell | Input (nu) | Output (nu) | Input (korrekt) | Output (korrekt) |
|--------|-----------|------------|-----------------|------------------|
| google/gemini-2.5-flash | $0.15 | $0.60 | $0.30 | $2.50 |
| google/gemini-2.5-flash-lite | $0.075 | $0.30 | $0.10 | $0.40 |
| google/gemini-2.5-pro | $1.25 | $10.00 | $1.25 (OK) | $10.00 (OK) |
| openai/gpt-5 | $2.00 | $8.00 | $1.25 | $10.00 |
| openai/gpt-5-mini | $0.40 | $1.60 | $0.25 | $2.00 |
| openai/gpt-5-nano | $0.10 | $0.40 | $0.05 | $0.40 |

### Kallor

- Lovable AI-dokumentation: https://docs.lovable.dev/integrations/ai
- OpenAI GPT-5 prislista (Simon Willison, aug 2025): https://simonwillison.net/2025/Aug/7/gpt-5/
- Google Gemini-priser via pricepertoken.com

### Teknisk andring

**Fil: `src/components/dashboard/AIUsageDialog.tsx`**

Uppdatera `MODEL_PRICING`-objektet med korrekta priser:

```typescript
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "google/gemini-2.5-flash": { input: 0.30, output: 2.50 },
  "google/gemini-2.5-flash-lite": { input: 0.10, output: 0.40 },
  "google/gemini-2.5-pro": { input: 1.25, output: 10.00 },
  "openai/gpt-5": { input: 1.25, output: 10.00 },
  "openai/gpt-5-mini": { input: 0.25, output: 2.00 },
  "openai/gpt-5-nano": { input: 0.05, output: 0.40 },
  "unknown": { input: 0.30, output: 2.50 },
};
```

Notera att "unknown"-fallback ocksa uppdateras till Gemini 2.5 Flash-priset (den vanligaste modellen).

Ingen annan kod behover andras -- alla berakningar anvander redan `MODEL_PRICING`-mapen.

