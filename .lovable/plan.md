

## Mal

Nar en ny anvandare utan kunder skriver "Skapa ny offert" ska de fa ett tydligt meddelande som forklarar varfor det inte gar, plus en knapp for att skapa en ny kund.

---

## Nuvarande beteende

Nar kundlistan ar tom returneras:
```
type: "text"
content: "Du har inga kunder annu. Skapa en kund forst."
```
Bara text, ingen knapp, anvandaren vet inte vad de ska gora.

## Nytt beteende

Returnera ett `result`-meddelande med en aktionsknapp:

```text
+------------------------------------------+
| Du har inga kunder annu att koppla en     |
| offert till. Skapa en kund forst sa kan   |
| vi borja!                                 |
|                                           |
| [Skapa ny kund]                           |
+------------------------------------------+
```

Nar anvandaren klickar pa knappen skickas meddelandet "Jag vill skapa en ny kund" i chatten, precis som "Ny kund"-knappen i offertformulaeret.

---

## Teknisk implementation

### Fil: `supabase/functions/global-assistant/index.ts`

**Andring pa rad 3681-3698** -- Byt `type: "text"` till `type: "result"` med `nextActions`:

Fran:
```typescript
case "get_customers_for_estimate": {
  const customers = results as Array<{ id: string; name: string }>;
  if (customers.length === 0) {
    return {
      type: "text",
      content: "Du har inga kunder annu. Skapa en kund forst.",
    };
  }
  return {
    type: "estimate_form",
    content: "",
    data: { customers },
  };
}
```

Till:
```typescript
case "get_customers_for_estimate": {
  const customers = results as Array<{ id: string; name: string }>;
  if (customers.length === 0) {
    return {
      type: "result",
      content: "Du har inga kunder annu att koppla en offert till. Skapa en kund forst sa kan vi borja!",
      data: {
        success: false,
        resultMessage: "Du har inga kunder annu att koppla en offert till. Skapa en kund forst sa kan vi borja!",
        nextActions: [
          { label: "Skapa ny kund", icon: "user-plus", prompt: "Jag vill skapa en ny kund" },
        ],
      },
    };
  }
  return {
    type: "estimate_form",
    content: "",
    data: { customers },
  };
}
```

---

## Sammanfattning

| # | Fil | Andring |
|---|-----|---------|
| 1 | `global-assistant/index.ts` | Byt text-svar till result-kort med "Skapa ny kund"-knapp vid tom kundlista |

## Resultat

- Nya anvandare far ett tydligt meddelande som forklarar att de behover en kund forst
- En klickbar knapp ("Skapa ny kund") tar dem direkt till kundformulaeret
- Nar kunden ar skapad kan de skriva "Skapa ny offert" igen och da visas formulaeret som vanligt
