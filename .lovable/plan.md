

## Koppla leverantörsfakturor till ekonomiöversikten i Byggio AI

### Problem
När du frågar Byggio AI om ekonomiöversikten för ett projekt hämtas bara kundfakturor. Leverantörsfakturor (inköp/kostnader) ignoreras helt, trots att de finns inlagda på projektet.

### Lösning

Hämta leverantörsfakturor i edge-funktionen och visa dem i EconomyCard.

**Steg 1: `supabase/functions/global-assistant/index.ts`**

I både `get_project_economy` och `get_project_overview`:

- Lägg till en query mot `vendor_invoices` filtrerad på `project_id`
- Beräkna total kostnad (ex moms och inkl moms)
- Returnera nya fält: `vendor_cost_ex_vat`, `vendor_cost_inc_vat`, `vendor_invoice_count`

Ny kod (efter customer_invoices-queryn, ca rad 1618 och rad 1703):
```typescript
// Get vendor invoices (costs/expenses)
const { data: vendorInvoices } = await supabase
  .from("vendor_invoices")
  .select("total_ex_vat, total_inc_vat, status, supplier_name")
  .eq("project_id", project_id);

const vendorCostExVat = (vendorInvoices || [])
  .reduce((sum, v) => sum + (v.total_ex_vat || 0), 0);

const vendorCostIncVat = (vendorInvoices || [])
  .reduce((sum, v) => sum + (v.total_inc_vat || 0), 0);
```

Lägg till i return-objektet:
```typescript
vendor_cost_ex_vat: vendorCostExVat,
vendor_cost_inc_vat: vendorCostIncVat,
vendor_invoice_count: vendorInvoices?.length || 0,
```

**Steg 2: `src/components/global-assistant/EconomyCard.tsx`**

- Utöka `data`-interfacet med `vendor_cost_ex_vat`, `vendor_cost_inc_vat`, `vendor_invoice_count`
- Lägg till ett nytt visuellt kort i grid:et (bredvid ÄTA) som visar leverantörskostnader med en röd/orange ikon (t.ex. `ShoppingCart` eller `Truck`)
- Lägg till en progress bar som visar "Kostnader vs offert" (vendor_cost / estimate_total)

Nytt kort:
```tsx
{/* Leverantörskostnader */}
<div className="p-3 rounded-lg bg-red-500/10 space-y-1">
  <div className="flex items-center gap-2 text-red-600">
    <ShoppingCart className="h-4 w-4" />
    <span className="text-xs font-medium">Inköp ({data.vendor_invoice_count || 0})</span>
  </div>
  <p className="text-lg font-semibold">{formatCurrency(data.vendor_cost_ex_vat || 0)}</p>
</div>
```

Grid ändras från `grid-cols-2` till att rymma 5 kort (3+2 eller fortfarande 2 kolumner med en extra rad).

### Resultat
- Leverantörsfakturor syns i ekonomiöversikten med totalbelopp
- Antal leverantörsfakturor visas
- Lättare att se projektets faktiska kostnader jämfört med budget/offert
