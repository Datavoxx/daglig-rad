

## Åtgärdsplan: Fixa Veckoberäkning för Statistikkort

### Problemet

Statistikkortet "Denna vecka" visar **0.0 timmar** trots att kalendern visar **15.5 timmar** för samma vecka.

**Orsak**: JavaScript's `getDay()` returnerar 0 för söndag, vilket gör att beräkningen `today.getDate() - today.getDay() + 1` blir fel på söndagar.

| Dag | getDay() | Beräknat startdatum | Förväntat |
|-----|----------|---------------------|-----------|
| Måndag | 1 | Korrekt (måndag) | ✓ |
| Tisdag | 2 | Korrekt (måndag) | ✓ |
| ... | ... | ... | ... |
| Lördag | 6 | Korrekt (måndag) | ✓ |
| **Söndag** | 0 | **Måndag NÄSTA vecka!** | ✗ |

### Lösning

Ersätt den manuella beräkningen med `date-fns`'s `startOfWeek`-funktion som redan används i kalendern och hanterar söndagar korrekt.

### Kodändring

**Fil:** `src/pages/TimeReporting.tsx`

```typescript
// Innan (rad 212-217)
const today = new Date();
const startOfWeek = new Date(today);
startOfWeek.setDate(today.getDate() - today.getDay() + 1);
const weeklyHours = timeEntries
  .filter((entry: any) => new Date(entry.date) >= startOfWeek)
  .reduce((sum: number, entry: any) => sum + Number(entry.hours), 0);

// Efter
import { startOfWeek } from "date-fns"; // Lägg till i imports

const today = new Date();
const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Måndag som veckostart
const weeklyHours = timeEntries
  .filter((entry: any) => new Date(entry.date) >= weekStart)
  .reduce((sum: number, entry: any) => sum + Number(entry.hours), 0);
```

### Sammanfattning

| Fil | Ändring |
|-----|---------|
| `src/pages/TimeReporting.tsx` | Lägg till `startOfWeek` i import från `date-fns` |
| `src/pages/TimeReporting.tsx` | Ersätt manuell veckoberäkning med `startOfWeek(today, { weekStartsOn: 1 })` |

### Resultat

- Statistikkortet visar samma veckodata som kalendern
- Fungerar korrekt oavsett vilken dag i veckan det är
- Konsistent användning av `date-fns` genom hela applikationen

