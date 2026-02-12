

## Fix: Token-loggning saknas i edge functions

### Problem
Tokens visas som `0 / 0` i AI-anvandningspopupen. Orsaken ar att flera edge functions inte loggar token-data korrekt:

1. **global-assistant** (den mest anvanda): Loggningen sker **innan** AI-svaret parsas, sa `usage`-data fran svaret aldrig inkluderas. Dessutom saknas `tokens_in` och `tokens_out` helt i insert-raden.
2. **extract-vendor-invoice**: Saknar token-falten helt i insert-raden.

De ovriga 12 funktionerna (generate-estimate, agent-chat, etc.) loggar korrekt efter att svaret parsats med `data.usage?.prompt_tokens`.

### Losning

**1. global-assistant/index.ts**
- Flytta loggningsblocket sa det kors **efter** `const aiData = await aiResponse.json()` (rad 4430)
- Lagg till `tokens_in: aiData.usage?.prompt_tokens` och `tokens_out: aiData.usage?.completion_tokens` och `output_size` i insert-raden
- Behall `response_time_ms` och `input_size`

**2. extract-vendor-invoice/index.ts**
- Lagga till token-falt fran AI-svaret i insert-raden (om `usage`-objektet finns i svaret fran den modellen)

### Filer som andras
- `supabase/functions/global-assistant/index.ts` -- flytta loggning + lagg till tokens
- `supabase/functions/extract-vendor-invoice/index.ts` -- lagg till tokens

### Resultat
Efter andringen borjar alla nya AI-anrop logga faktiska token-varden, och popupen visar korrekt data istallet for `0 / 0`.
