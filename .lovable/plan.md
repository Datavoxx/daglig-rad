

# Plan: Fixa röstinspelning i hela applikationen + Ta bort felaktig artikelsynkronisering

## Sammanfattning

Röstinspelningen fungerar inte för Saga (Offert), Bo (Planering) eller Ulla (Arbetsorder/Dagrapport) på grund av ofullständiga CORS-headers i alla edge-funktioner. Dessutom ska den oönskade automatiska artikelsynkroniseringen tas bort.

---

## Identifierat problem

Alla röstrelaterade edge-funktioner har samma CORS-konfiguration:

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
```

Supabase-klienten skickar nu ytterligare headers som blockeras:
- `x-supabase-client-platform`
- `x-supabase-client-platform-version`
- `x-supabase-client-runtime`
- `x-supabase-client-runtime-version`

---

## Edge-funktioner som behöver fixas

| Funktion | AI-agent | Används för |
|----------|----------|-------------|
| `apply-full-estimate-voice` | Saga | Offertbyggaren - fullständig röststyrning |
| `apply-estimate-voice-edits` | Saga | Offertposter - röstredigering |
| `apply-summary-voice-edits` | Saga | Offertsammanfattning - röstredigering |
| `apply-voice-edits` | Saga/Bo/Ulla | Universell redigerare (rapport/planering/mall/arbetsorder/ÄTA) |
| `generate-plan` | Bo | Planering - generera tidplan från röst |
| `generate-report` | Ulla | Dagrapport - generera från röst |
| `parse-template-voice` | Saga | Mallar - skapa mall från röst |
| `prefill-inspection` | Ulla | Egenkontroll - förifylla från röst |

---

## Korrigerad CORS-konfiguration

Alla funktioner ovan ska använda:

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
```

---

## Del 2: Ta bort artikelsynkronisering från useEstimate.ts

### Kod som tas bort (rad 7-26)

```typescript
// Maps estimate article categories to article library categories
function mapToArticleCategory(article: string | undefined): string {
  ...
}
```

### Kod som tas bort (rad 535-579)

```typescript
// Sync new items to article library
const itemsWithDescriptions = state.items.filter(
  item => item.description?.trim() && item.unit_price > 0
);
...
```

---

## Filer som ändras

| Fil | Ändring |
|-----|---------|
| `supabase/functions/apply-full-estimate-voice/index.ts` | Uppdatera CORS-headers (rad 3-6) |
| `supabase/functions/apply-estimate-voice-edits/index.ts` | Uppdatera CORS-headers (rad 3-6) |
| `supabase/functions/apply-summary-voice-edits/index.ts` | Uppdatera CORS-headers (rad 3-6) |
| `supabase/functions/apply-voice-edits/index.ts` | Uppdatera CORS-headers (rad 3-6) |
| `supabase/functions/generate-plan/index.ts` | Uppdatera CORS-headers (rad 3-6) |
| `supabase/functions/generate-report/index.ts` | Uppdatera CORS-headers (rad 3-6) |
| `supabase/functions/parse-template-voice/index.ts` | Uppdatera CORS-headers (rad 3-6) |
| `supabase/functions/prefill-inspection/index.ts` | Uppdatera CORS-headers (rad 3-6) |
| `src/hooks/useEstimate.ts` | Ta bort mapToArticleCategory + synkroniseringslogik |

---

## Resultat efter fix

- Saga (Offert) fungerar igen
- Bo (Planering) fungerar igen
- Ulla (Arbetsorder, Dagrapport, Egenkontroll, ÄTA) fungerar igen
- Inga offertrader synkas automatiskt till artikelbiblioteket

