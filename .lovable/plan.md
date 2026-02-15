

## Fix: Korrekt marginalberäkning, avrundning och projektlänk i ekonomikortet

### Problem 1: Olika marginalsummor (459 088 vs 462 938)
Projektvyn beräknar: `marginal = (offert + ÄTA) - (leverantörskostnad + arbetskostnad)`
Assistentens kort beräknar: `marginal = (offert + ÄTA) - leverantörskostnad`

Arbetskostnaden (timmar x timpris) saknas helt i assistentens beräkning. I projektvyn: arbetskostnad = 3 850 kr (7h x timpris). Det förklarar skillnaden: 462 938 - 3 850 = 459 088.

### Problem 2: Ören/decimaler (461 437,5 kr)
`formatCurrency` i EconomyCard använder `toLocaleString("sv-SE")` som visar decimaler. Ska avrundas till hela kronor (Sverige använder inte ören längre).

### Problem 3: Ingen länk till projektet
Användaren vill snabbt kunna navigera till projektet från ekonomikortet.

---

### Lösning

**Steg 1: Edge-funktionen (`supabase/functions/global-assistant/index.ts`)**

I `get_project_economy` (rad 1591-1597):
- Hämta `billing_types(hourly_rate)` tillsammans med `hours` i time_entries-queryn
- Beräkna `labor_cost_actual` (timmar x timpris per post)
- Returnera `labor_cost_actual` och `project_id` i response-data

I response-formatteringen (rad 3424-3462):
- Inkludera `vendor_cost_ex_vat`, `vendor_cost_inc_vat`, `vendor_invoice_count` och `labor_cost_actual` i type-definitionen
- Skicka med `project_id` i data-objektet
- Avrunda alla `toLocaleString`-anrop med `{ maximumFractionDigits: 0 }`
- Lägg till leverantörsfakturor i markdown-texten

**Steg 2: EconomyCard (`src/components/global-assistant/EconomyCard.tsx`)**

- Uppdatera `formatCurrency` att avrunda till hela kronor: `Math.round(amount).toLocaleString("sv-SE") + " kr"`
- Uppdatera marginberäkningen: `margin = (offert + ÄTA) - (leverantörskostnad + arbetskostnad)`
- Lägg till `labor_cost_actual` i data-interfacet
- Lägg till en klickbar länk/knapp högst upp i kortet: "Gå till projekt" som navigerar till `/projects/{project_id}`

**Steg 3: Typer (`src/types/global-assistant.ts`)**

- Lägg till `labor_cost_actual` och `project_id` i `MessageData`

### Tekniska detaljer

Edge-funktionens nya time_entries-query:
```typescript
const { data: timeEntries } = await supabase
  .from("time_entries")
  .select("hours, billing_types(hourly_rate)")
  .eq("project_id", project_id);

const totalHours = (timeEntries || []).reduce((sum, e) => sum + (e.hours || 0), 0);
const laborCostActual = (timeEntries || []).reduce((sum, e) => {
  const rate = e.billing_types?.hourly_rate || 0;
  return sum + (e.hours * rate);
}, 0);
```

EconomyCard marginberäkning:
```typescript
const laborCost = data.labor_cost_actual || 0;
const totalExpenses = vendorCost + laborCost;
const margin = totalProjectValue - totalExpenses;
```

Projektlänk-knapp (högst upp i kortet):
```tsx
{data.project_id && (
  <Link to={`/projects/${data.project_id}`}>
    <Button variant="outline" size="sm">
      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
      Gå till projekt
    </Button>
  </Link>
)}
```
