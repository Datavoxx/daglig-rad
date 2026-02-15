

## Visa text på alla flikar i projektvyn

### Vad ändras
Flikarna i projektvyn (Översikt, ÄTA, Arbetsorder, Filer, Planering, Dagbok) visar just nu texten bara på bredare skärmar (`hidden xs:inline`). Vi tar bort den dolda klassen så att texten alltid visas bredvid ikonen, precis som i referensbilden.

Dessutom ändras "Order" till "Arbetsorder" för att matcha referensbilden.

### Teknisk ändring i `src/pages/ProjectView.tsx`

- Rad 126: `<span className="hidden xs:inline">Översikt</span>` -- ta bort `hidden xs:inline`, behåll bara `<span>Översikt</span>`
- Rad 135: Samma sak for "ÄTA"
- Rad 144: Ändra texten från "Order" till "Arbetsorder" och ta bort `hidden xs:inline`
- Rad 153: Samma sak for "Filer"
- Rad 162 (ungefär): Samma sak for "Planering" (ändra label till "Planering")
- Rad 171 (ungefär): Samma sak for "Dagbok"

Alla sex `<span>`-element i TabsTrigger-komponenterna uppdateras från `className="hidden xs:inline"` till ingen className alls. Tooltip-wrapperna kan behållas som fallback men texten syns nu alltid.
