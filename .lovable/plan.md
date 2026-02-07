
# Plan: Optimera första offert-formuläret med Direct Pattern Matching

## Problem

Det första steget ("skapa offert") tar ~3 sekunder eftersom meddelandet går igenom hela AI-tolkningen, medan steg 2 tar ~1 sekund tack vare direct pattern matching som hoppar över AI:n.

## Lösning

Lägg till pattern matching för enkla offert-kommandon som kör `get_customers_for_estimate` direkt utan att gå via AI:n.

---

## Teknisk implementation

### Nya patterns att lägga till (rad ~3535, efter befintliga patterns)

```typescript
// Pattern 3: Enkla offert-förfrågningar (visa formulär direkt utan AI)
const simpleEstimateFormPattern = /^(?:skapa|ny|new|create)\s*(?:en\s+)?offert(?:\s*$|\s+(?:åt|för|till)\s|[?.!]?\s*$)/i;
const simpleEstimateFormMatch = message.match(simpleEstimateFormPattern);

if (simpleEstimateFormMatch) {
  console.log("Direct pattern matched: get_customers_for_estimate (simple request)");
  
  // Hämta kunder direkt
  const { data: customers, error } = await supabase
    .from("customers")
    .select("id, name")
    .eq("user_id", userId)
    .order("name");
  
  if (error) {
    console.error("Error fetching customers:", error);
    return new Response(JSON.stringify({
      type: "text",
      content: "Kunde inte hämta kunder. Försök igen.",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  if (!customers || customers.length === 0) {
    return new Response(JSON.stringify({
      type: "text",
      content: "Du har inga kunder ännu. Skapa en kund först.",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  return new Response(JSON.stringify({
    type: "estimate_form",
    content: "",
    data: { customers },
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```

### Patterns som matchas

| Meddelande | Matchar? |
|------------|----------|
| `skapa offert` | ✅ |
| `ny offert` | ✅ |
| `skapa en offert` | ✅ |
| `skapa offert för X` | ✅ (men data saknas, visar formulär) |
| `create estimate` | ✅ |
| `Skapa offert "Renovering" för kund med ID abc-123` | ❌ (matchas av pattern 1 istället) |

---

## Filer att ändra

| Fil | Ändring |
|-----|---------|
| `supabase/functions/global-assistant/index.ts` | Lägg till pattern 3 efter befintliga patterns (rad ~3535) |

---

## Förväntat resultat

| Steg | Före | Efter |
|------|------|-------|
| "Skapa offert" | ~3s (via AI) | **~1s** (direct) |
| Formulär-submit | ~1s (direct) | ~1s (direct) |
| Totalt | ~4s | **~2s** |

---

## Ordning på patterns

Ordningen är viktig - specifika patterns måste komma före generella:

```
1. createEstimatePattern → Innehåller titel + kund-ID → create_estimate
2. addItemsPattern → Innehåller estimate_id + data → add_estimate_items  
3. simpleEstimateFormPattern → Enkel förfrågan → visa formulär (NY!)
```

På så sätt fångas specifika kommandon först, och generella "skapa offert" faller ner till formulär-patternet.
