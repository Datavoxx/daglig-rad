
# Plan: Fixa offertposter-sparande + lägg till Tidsplan

## Problemanalys

Jag har identifierat **tre problem** som gör att datan inte sparas korrekt:

### Problem 1: Fel databasfält används
**Backend sparar till:**
- `introduction_text` ← "Projektbeskrivning" i formuläret

**Men EstimateBuilder använder:**
- `scope` ← Projektbeskrivning
- `assumptions` (JSON array) ← Tidsplan

Så datan sparas i fel fält och syns därför inte i offerten!

### Problem 2: Tidsplan-fält saknas helt
Formuläret `EstimateItemsFormCard` har inget tidsplan-fält. Screenshoten från /estimates visar att det finns både "Projektbeskrivning" och "Tidsplan" - men chatformulären har bara "Projektbeskrivning".

### Problem 3: Fältnamn i toolet stämmer inte
Backend-toolet `add_estimate_items` tar emot `introduction` men sparar det till `introduction_text` istället för `scope`.

---

## Lösning

### 1. Lägg till Tidsplan-fält i EstimateItemsFormCard.tsx

**Före:**
```
[Projektbeskrivning] → introduction
[Offertposter]
[Tillval]
```

**Efter:**
```
[Projektbeskrivning] → introduction (mappar till scope)
[Tidsplan] → timeline (mappar till assumptions)
[Offertposter]
[Tillval]
```

### 2. Uppdatera EstimateItemsFormData-typen

Lägg till `timeline` fält:
```typescript
export interface EstimateItemsFormData {
  estimateId: string;
  introduction: string;   // → sparas till "scope"
  timeline: string;       // → sparas till "assumptions" (som array)
  items: Array<...>;
  addons: Array<...>;
}
```

### 3. Uppdatera backend-toolet add_estimate_items

Ändra vilka fält som sparas:
```typescript
// Spara till RÄTT fält
if (introduction) {
  await supabase
    .from("project_estimates")
    .update({ 
      scope: introduction,  // ← Projektbeskrivning
    })
    .eq("id", estimate_id);
}

if (timeline) {
  // Konvertera till array (en rad per punkt)
  const assumptionsArray = timeline.split("\n").filter(s => s.trim());
  await supabase
    .from("project_estimates")
    .update({ 
      assumptions: assumptionsArray,  // ← Tidsplan
    })
    .eq("id", estimate_id);
}
```

### 4. Uppdatera tool definition

Lägg till `timeline` parameter:
```typescript
{
  name: "add_estimate_items",
  parameters: {
    properties: {
      estimate_id: { type: "string" },
      introduction: { type: "string", description: "Project description (scope)" },
      timeline: { type: "string", description: "Timeline/schedule (one item per line)" },  // NY!
      items: { ... },
      addons: { ... },
    },
  },
}
```

### 5. Uppdatera GlobalAssistant.tsx

Inkludera timeline i formData-typen och skicka med i pendingData.

---

## Filer att ändra

| Fil | Ändring |
|-----|---------|
| `src/components/global-assistant/EstimateItemsFormCard.tsx` | 1. Lägg till `timeline` state |
| | 2. Lägg till Tidsplan textarea efter Projektbeskrivning |
| | 3. Inkludera `timeline` i handleSubmit |
| `src/pages/GlobalAssistant.tsx` | 4. Uppdatera handleEstimateItemsFormSubmit med timeline |
| `supabase/functions/global-assistant/index.ts` | 5. Uppdatera tool definition med timeline |
| | 6. Ändra sparlogik: introduction → scope, timeline → assumptions |

---

## Detaljerad implementation

### EstimateItemsFormCard.tsx

**Ny UI efter Projektbeskrivning:**
```tsx
{/* Tidsplan */}
<div className="space-y-1.5">
  <Label htmlFor="timeline" className="text-xs">
    Tidsplan
  </Label>
  <Textarea
    id="timeline"
    placeholder="En punkt per rad..."
    value={timeline}
    onChange={(e) => setTimeline(e.target.value)}
    disabled={disabled}
    rows={2}
    className="text-sm"
  />
</div>
```

### Backend (index.ts)

**Tool definition (rad ~600):**
```typescript
{
  name: "add_estimate_items",
  parameters: {
    properties: {
      estimate_id: { type: "string" },
      introduction: { type: "string", description: "Project description (scope)" },
      timeline: { type: "string", description: "Timeline/schedule text" },
      items: { ... },
      addons: { ... },
    },
    required: ["estimate_id"],
  },
}
```

**executeTool (rad ~1570):**
```typescript
case "add_estimate_items": {
  const { estimate_id, introduction, timeline, items, addons } = args as {
    estimate_id: string;
    introduction?: string;
    timeline?: string;
    items?: Array<...>;
    addons?: Array<...>;
  };

  // Verifiera offert...

  // Uppdatera scope (projektbeskrivning) och assumptions (tidsplan)
  const updateData: Record<string, unknown> = {};
  if (introduction) {
    updateData.scope = introduction;
  }
  if (timeline) {
    // Konvertera till array
    updateData.assumptions = timeline.split("\n").filter(s => s.trim());
  }

  if (Object.keys(updateData).length > 0) {
    await supabase
      .from("project_estimates")
      .update(updateData)
      .eq("id", estimate_id);
  }

  // Resten av logiken för items och addons...
}
```

---

## Förväntat resultat

| Fält i formulär | Sparas till | Visas i offert |
|-----------------|-------------|----------------|
| Projektbeskrivning | `scope` | ✅ Projektbeskrivning |
| Tidsplan | `assumptions` (JSON array) | ✅ Tidsplan |
| Offertposter | `estimate_items` tabell | ✅ Offertposter |
| Tillval | `estimate_addons` tabell | ✅ Tillval |

---

## UI efter fix

```text
┌─────────────────────────────────────┐
│ [📝] Lägg till offertposter         │
│     OFF-2026-0036                   │
│                                     │
│ Projektbeskrivning                  │
│ ┌─────────────────────────────────┐ │
│ │ VVV                             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Tidsplan                     ← NY!  │
│ ┌─────────────────────────────────┐ │
│ │ En punkt per rad...             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ───── Offertposter ─────            │
│ Rad 1: [Arbete] [tim] [test] [850] │
│ + Lägg till rad                     │
│                                     │
│ ───── Tillval ─────                 │
│ + Lägg till tillval                 │
│                                     │
│ Totalt: 850 kr                      │
│                                     │
│       [Avbryt]  [Spara offert]      │
└─────────────────────────────────────┘
```
