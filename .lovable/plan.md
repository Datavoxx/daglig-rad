

## Problem

Det finns en generell kontroll pa rad 2606 i `global-assistant/index.ts` som fangar ALLA tomma resultat innan den specifika logiken for `get_customers_for_estimate` kors:

```typescript
if (!results || (Array.isArray(results) && results.length === 0)) {
  return {
    type: "text",
    content: "Jag hittade inga resultat. Vill du soka efter nagot annat eller skapa ny?",
  };
}
```

Detta innebar att var fix pa rad 3684 (som returnerar ett resultat-kort med "Skapa ny kund"-knappen) aldrig nas -- den generella kontrollen returnerar forst.

## Losning

Exkludera `get_customers_for_estimate` fran den generella tomma-resultat-kontrollen, sa att dess specifika case i switch-satsen far hantera tomma listor sjalv.

## Teknisk implementation

### Fil: `supabase/functions/global-assistant/index.ts`

**Rad 2606**: Lagg till ett undantag for `get_customers_for_estimate`:

Fran:
```typescript
if (!results || (Array.isArray(results) && results.length === 0)) {
  return {
    type: "text",
    content: "Jag hittade inga resultat. Vill du soka efter nagot annat eller skapa ny?",
  };
}
```

Till:
```typescript
const toolsWithCustomEmptyHandling = ["get_customers_for_estimate"];
if (
  (!results || (Array.isArray(results) && results.length === 0)) &&
  !toolsWithCustomEmptyHandling.includes(toolName)
) {
  return {
    type: "text",
    content: "Jag hittade inga resultat. Vill du soka efter nagot annat eller skapa ny?",
  };
}
```

Ingen annan andring behovs -- den befintliga koden pa rad 3684 hanterar redan det tomma fallet korrekt med resultat-kort och "Skapa ny kund"-knapp.

## Sammanfattning

| # | Fil | Andring |
|---|-----|---------|
| 1 | `global-assistant/index.ts` | Undanta `get_customers_for_estimate` fran generell tom-resultat-kontroll |

## Resultat

- Nar en anvandare utan kunder skriver "Skapa ny offert" nar nu koden fram till rad 3684
- Dar visas meddelandet "Du har inga kunder annu..." med en "Skapa ny kund"-knapp
- Befintliga anvandare med kunder paverkas inte
