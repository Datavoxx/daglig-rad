

## Visa timsammanställning per anställd i Inställningar

### Vad som ska byggas

Lägga till en sektion i varje anställds rad som visar deras totala arbetade timmar, så att du snabbt kan se en sammanfattning av varje persons arbetsinsats direkt under Inställningar → Anställda.

### Design

Varje anställd-rad utökas med:
- **Totalt arbetade timmar** (denna månad + totalt)
- Visuell indikator som gör det enkelt att se

**Utseende:**
```
┌─────────────────────────────────────────────────────────────┐
│ [Avatar] Erik Svensson          [Aktiv]                     │
│          📞 070-123 45 67  ✉️ erik@mail.se                   │
│          ⏱️ 24h denna månad • 156h totalt                   │
│                                      [Bjud in] [✏️] [🗑️]   │
└─────────────────────────────────────────────────────────────┘
```

### Teknisk implementation

#### 1. Ny query för tidsdata

Lägg till en useQuery i EmployeeManager.tsx för att hämta sammanlagda timmar per anställd:

```typescript
const { data: employeeHours = {} } = useQuery({
  queryKey: ["employee-hours-summary"],
  queryFn: async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return {};

    // Hämta alla tidposter för arbetsgivarens anställda
    const { data: entries, error } = await supabase
      .from("time_entries")
      .select("user_id, hours, date")
      .eq("employer_id", userData.user.id);

    if (error) throw error;

    // Aggregera timmar per user_id
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const hoursByUser: Record<string, { thisMonth: number; total: number }> = {};
    
    entries?.forEach(entry => {
      if (!hoursByUser[entry.user_id]) {
        hoursByUser[entry.user_id] = { thisMonth: 0, total: 0 };
      }
      
      const entryDate = new Date(entry.date);
      hoursByUser[entry.user_id].total += Number(entry.hours);
      
      if (entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear) {
        hoursByUser[entry.user_id].thisMonth += Number(entry.hours);
      }
    });

    return hoursByUser;
  },
});
```

#### 2. Uppdatera Employee-raden

Lägg till en ny rad under kontaktinformationen som visar timmar:

```typescript
import { Clock } from "lucide-react";

// I renderingen för varje anställd:
const employeeUserId = employee.linked_user_id;
const hours = employeeUserId ? employeeHours[employeeUserId] : null;

// Under kontaktinfo-raden:
{hours && (hours.thisMonth > 0 || hours.total > 0) && (
  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
    <Clock className="h-3 w-3" />
    <span>{hours.thisMonth}h denna månad</span>
    <span className="text-muted-foreground/50">•</span>
    <span>{hours.total}h totalt</span>
  </div>
)}
```

#### 3. Formatering av timmar

Lägg till en hjälpfunktion för snygg formatering:

```typescript
function formatHours(hours: number): string {
  if (hours === 0) return "0h";
  if (Number.isInteger(hours)) return `${hours}h`;
  return `${hours.toFixed(1)}h`;
}
```

### Filer som påverkas

| Fil | Ändring |
|-----|---------|
| `src/components/settings/EmployeeManager.tsx` | Lägg till query för timdata + visa i UI |

### Fördelar

- **Snabb överblick** - Se direkt hur mycket varje anställd arbetat
- **Trend-indikator** - Månadsdata visar aktuell arbetsbelastning
- **Ingen extra navigering** - Informationen finns direkt i anställdlistan

