

## Fixa: Referenstaggen kvarstår + Uppdatera-fel

### Problem 1: Referenstaggen forsvinner inte
Efter att ett meddelande skickats med en referenstagg (t.ex. `[Projekt: Badrumsrenovering]`) ligger taggen kvar ovanfor inputrutan. Den borde forsvinna direkt efter att meddelandet skickats.

### Problem 2: Uppdatera-fel (alla typer)
Felet beror pa att AI:n skickar offert-nummer (t.ex. `"OFF-2026-0001"`) som `estimate_id` istallet for det riktiga UUID:t. Systemet har redan logik for att automatiskt losa upp `project_id` och `customer_id` fran namn till UUID, men den logiken saknas for `estimate_id`. Nar systemet forsker anvanda `"OFF-2026-0001"` som UUID i en databasfraga far vi felmeddelandet `invalid input syntax for type uuid`.

---

### Andringar

#### 1. `src/pages/GlobalAssistant.tsx`
Lagga till `setActiveReference(null)` direkt efter att meddelandet skapats, sa att taggen forsvinner nar meddelandet skickas.

#### 2. `supabase/functions/global-assistant/index.ts`
Tre andringar:

**a) Lagg till `ESTIMATE_TOOLS`-lista** (bredvid `PROJECT_TOOLS` och `CUSTOMER_TOOLS`):
```text
ESTIMATE_TOOLS = [
  "get_estimate", "update_estimate", "delete_estimate",
  "add_estimate_items", "delete_estimate_item",
  "create_project_from_estimate"
]
```

**b) Lagg till auto-inject av `estimate_id` fran kontext:**
Om `selectedEstimateId` finns i kontexten och verktyget behover `estimate_id`, injicera det automatiskt.

**c) Lagg till resolve-logik for `estimate_id`:**
Om AI:n skickar nagon som inte ar ett UUID (t.ex. `"OFF-2026-0001"`), sok upp det riktiga UUID:t via `offer_number` i `project_estimates`-tabellen.

### Filandringar

| Fil | Andring |
|-----|---------|
| `src/pages/GlobalAssistant.tsx` | Lagg till `setActiveReference(null)` efter meddelande skickats |
| `supabase/functions/global-assistant/index.ts` | Lagg till ESTIMATE_TOOLS, auto-inject + resolve for estimate_id |

