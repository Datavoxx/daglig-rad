
## Uppdatera offertlistan: "Klar" till "Godkänd" med bättre badge-stil

### Problem
Offertlistan (`/estimates`) visar fortfarande "Klar" med en solid grön bakgrund (`bg-green-600`) for godkända offerter. Detta matchar inte den uppdaterade headern som nu visar "GODKÄND" med den subtilare `success`-varianten.

### Ändringar i `src/pages/Estimates.tsx`

Det finns **två ställen** som behöver uppdateras (mobil-vy och desktop-vy):

#### 1. Mobil-vy (rad ~325-330)
- Ändra texten från `"Klar"` till `"Godkänd"`
- Byt från `variant="default"` med `className="bg-green-600"` till `variant="success"` (utan extra className)

#### 2. Desktop-vy (rad ~407-412)
- Samma ändring: `"Klar"` till `"Godkänd"` och `variant="success"` istället for grön bakgrund

### Teknisk sammanfattning

| Fil | Rad | Ändring |
|-----|-----|---------|
| `src/pages/Estimates.tsx` | ~325-330 | Badge: "Klar" -> "Godkänd", variant `success`, ta bort `bg-green-600` |
| `src/pages/Estimates.tsx` | ~407-412 | Badge: "Klar" -> "Godkänd", variant `success`, ta bort `bg-green-600` |

### Resultat
Offertlistan matchar headerns stil: subtil grön badge med texten "Godkänd" istället for vit text på solid grön bakgrund med texten "Klar".
