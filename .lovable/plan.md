

## Problem

Meddelandet "Du har inga kunder ännu att koppla en offert till..." visas dubbelt eftersom:
1. `content` renderas av `ResultCard` som en separat text
2. `data.resultMessage` renderas inuti kortet

Båda innehåller samma text.

## Lösning

Sätt `content` till en tom sträng i edge function-svaret så att bara `resultMessage` inuti kortet visas.

### Fil: `supabase/functions/global-assistant/index.ts`

I `get_customers_for_estimate`-caset (runt rad 3684), ändra:

```typescript
content: "Du har inga kunder ännu att koppla en offert till. Skapa en kund först så kan vi börja!",
```

Till:

```typescript
content: "",
```

`data.resultMessage` behåller texten och visas i kortet som vanligt. Ingen dubbel output.

| # | Fil | Ändring |
|---|-----|---------|
| 1 | `global-assistant/index.ts` | Töm `content`-fältet i det tomma-kund-svaret |
