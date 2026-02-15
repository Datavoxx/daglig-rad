

## Fix: Korrekt leverantörskostnad + beräknad marginal i ekonomikortet

### Problem 1: Fel belopp på Inköp
Inköp visar 3 200 kr (exkl moms) men projektvyn visar 4 000 kr (inkl moms). Datan i databasen är korrekt -- leverantörsfakturan har `total_ex_vat: 3200` och `total_inc_vat: 4000`. Problemet är att EconomyCard visar ex-moms medan projektvyn visar inkl-moms.

### Problem 2: Beräknad marginal saknas
Projektvyn visar "Beräknad marginal: 459 088 kr" men assistentens ekonomikort saknar denna rad helt.

### Lösning

**Fil 1: `src/components/global-assistant/EconomyCard.tsx`**

1. Byt från `vendor_cost_ex_vat` till `vendor_cost_inc_vat` i kortet -- detta matchar projektvyns beräkning (4 000 kr istället för 3 200 kr)
2. Lägg till ett nytt "Beräknad marginal"-block längst ned, beräknat som:
   - `marginal = offertbelopp + godkänd ÄTA - leverantörskostnad(inkl moms) - arbetskostnad`
   - Visas med grön text om positiv, röd om negativ
3. Uppdatera progress-barens beräkning att använda inkl-moms-beloppet

### Tekniska detaljer

Beräkning av marginal (samma logik som projektvyns `EconomicOverviewCard`):
- Projektvyn beräknar: `totalProjectValue = offertbelopp + godkända ÄTA`
- Sedan: `margin = totalProjectValue - totalExpenses`
- Vi har inte arbetskostnad (timmar x timpris) i assistenten, men vi har leverantörskostnaden

Ändringar i EconomyCard:
- Rad 36: `vendor_cost_ex_vat` byts till `vendor_cost_inc_vat`
- Ny sektion efter progress bars: Beräknad marginal med formaterad siffra
- Marginal beräknas som: `estimateTotal + ataApproved - vendorCost`

Nytt UI-block:
```
--- separator ---
Beräknad marginal          459 088 kr (grön)
```
