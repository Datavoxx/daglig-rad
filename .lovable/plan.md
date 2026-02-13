

## Uppskattad kostnad per AI-anrop i admin-popupen

### Vad vi gor
Lagger till en beraknad kostnad i dollar for varje AI-anrop baserat pa modell och antal tokens (in/ut). Kostnaden visas i sammanfattningen, per-anvandare, per-funktion, per-modell och i senaste-loggen.

### Prislista (per 1M tokens, baserat pa Lovable AI-modellerna)

| Modell | Input | Output |
|--------|-------|--------|
| google/gemini-2.5-flash | $0.15 | $0.60 |
| google/gemini-2.5-flash-lite | $0.075 | $0.30 |
| google/gemini-2.5-pro | $1.25 | $10.00 |
| openai/gpt-5 | $2.00 | $8.00 |
| openai/gpt-5-mini | $0.40 | $1.60 |
| openai/gpt-5-nano | $0.10 | $0.40 |

Priserna ar ungefar korrekta for respektive modell-tier. Anvandaren kan justera dem i koden vid behov.

### Tekniska andringar

**Fil: `src/components/dashboard/AIUsageDialog.tsx`**

1. Lagg till en `MODEL_PRICING`-map med pris per token (in/ut) for varje modell
2. Lagg till en `estimateCost(model, tokensIn, tokensOut)` hjalp-funktion
3. Uppdatera sammanfattnings-korten: lagg till ett femte kort "Uppskattad kostnad" med dollar-summa
4. Uppdatera per-anvandare-tabellen: lagg till en kolumn "Kostnad"
5. Uppdatera per-funktion-tabellen: lagg till en kolumn "Kostnad"
6. Uppdatera per-modell-tabellen: lagg till en kolumn "Kostnad"
7. Uppdatera senaste-loggen: lagg till kostnad per rad

Hjalp-funktionen:
```typescript
const estimateCost = (model: string | null, tokensIn: number, tokensOut: number) => {
  const pricing = MODEL_PRICING[model || "unknown"] || MODEL_PRICING["unknown"];
  return (tokensIn * pricing.input + tokensOut * pricing.output) / 1_000_000;
};
```

### Resultat
Varje tab och sammanfattningen visar en uppskattad dollarkostnad, sa du direkt kan se vad AI-anvandningen kostar per anvandare, funktion och modell.

