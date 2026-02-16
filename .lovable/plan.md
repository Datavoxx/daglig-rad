

## Fixa antal-faltet och verifiera paslagspanelen

### Problem 1: Antal-faltet kan inte rensas

Grundorsaken ar tva saker:

**a) Desktop-inputen (rad 592)** anvander `item.hours ?? item.quantity ?? ""` for arbetsrader. Nar man suddar faltets varde satter koden `hours: null`, men `quantity` ar fortfarande `1` (fran nar raden skapades). Da faller `??`-operatorn tillbaka till `1` och ettan dyker upp igen.

**Fix:** Andra value-logiken sa att den inte blandar ihop `hours` och `quantity`. For arbetsrader ska den bara visa `hours`, for ovriga bara `quantity`. Dessutom ska `null` rendera som `""` (tomt falt) men beraknas som `0`.

**b) Nya rader skapas med `quantity: 1` och `hours: 1`** (rad 158-160). Anvandaren vill att default ska vara `0` istallet for `1`.

### Andringar

| Fil | Rad | Andring |
|-----|-----|---------|
| `EstimateTable.tsx` | 158-160 | Andra default fran `quantity: 1, hours: 1` till `quantity: 0, hours: 0` |
| `EstimateTable.tsx` | 592 | Andra value fran `item.hours ?? item.quantity ?? ""` till bara `item.hours ?? ""` for labor, `item.quantity ?? ""` for ovriga. Behall separat logik for respektive typ. |

### Problem 2: Paslagspanelen

MarkupPanel-komponenten finns redan och ser korrekt ut i koden. Jag verifierar att den renderas ratt i EstimateBuilder (rad 553-555) och att `onItemsChange` korrekt uppdaterar state. Om det finns nagot renderingsproblem (t.ex. att raderna inte visas) kan det bero pa att alla items har `subtotal: 0` -- panelen filtrerar bort rader dar `subtotal > 0` inte ar uppfyllt. Jag andrar filtret sa att alla rader med en beskrivning visas oavsett subtotal.

| Fil | Rad | Andring |
|-----|-----|---------|
| `MarkupPanel.tsx` | ~76 | Ta bort filtret `item.subtotal > 0` sa att alla rader med beskrivning visas |

### Sammanfattning

Tva filer andras:
1. **EstimateTable.tsx** -- fixa quantity/hours value-logik och default-varden
2. **MarkupPanel.tsx** -- visa alla rader oavsett subtotal
