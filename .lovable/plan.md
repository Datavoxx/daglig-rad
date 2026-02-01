

## Fix: Visa rätt namn för admin/ägare i kalendervyn

### Problemet

Tidposter registrerade av dig själv (admin/ägaren) visas som "Okänd" eftersom:
1. `DayDetailPopover` tar inte emot `currentUserId` som prop
2. `getUserName()` anropas utan det tredje argumentet
3. Din `user_id` hittas inte bland `employees.linked_user_id` → fallback till "Okänd"

### Lösning

Skicka med aktuell användares ID genom hela komponentkedjan så att posten korrekt identifieras som "Du".

### Teknisk implementation

#### 1. TimeCalendarView.tsx - Hämta aktuell användare

Lägg till query för att hämta inloggad användare och skicka ID:t vidare:

```typescript
// Lägg till efter befintliga queries
const { data: currentUser } = useQuery({
  queryKey: ["current-user-calendar"],
  queryFn: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },
});

// Skicka till WeekView/MonthView
<WeekView 
  currentDate={currentDate} 
  entries={entries} 
  employees={employees}
  currentUserId={currentUser?.id}  // NY
  onDayClick={onDayClick} 
/>
```

#### 2. WeekView.tsx & MonthView.tsx - Propagera prop

Lägg till `currentUserId` i interface och skicka vidare till DayCell:

```typescript
interface WeekViewProps {
  currentDate: Date;
  entries: TimeEntryWithDetails[];
  employees: Employee[];
  currentUserId?: string;  // NY
  onDayClick: (date: Date) => void;
}

// I DayCell-anropet:
<DayCell
  ...
  currentUserId={currentUserId}  // NY
/>
```

#### 3. DayCell.tsx - Propagera till popover

Lägg till prop och skicka till DayDetailPopover:

```typescript
interface DayCellProps {
  ...
  currentUserId?: string;  // NY
}

<DayDetailPopover
  ...
  currentUserId={currentUserId}  // NY
/>
```

#### 4. DayDetailPopover.tsx - Använd i getUserName

Lägg till prop och använd i funktionsanropet:

```typescript
interface DayDetailPopoverProps {
  ...
  currentUserId?: string;  // NY
}

// Anropa med rätt argument:
const userName = getUserName(entry.user_id, employees, currentUserId);
```

### Filer som påverkas

| Fil | Ändring |
|-----|---------|
| `src/components/time-reporting/TimeCalendarView.tsx` | Hämta currentUser, skicka ID som prop |
| `src/components/time-reporting/WeekView.tsx` | Lägg till prop, propagera till DayCell |
| `src/components/time-reporting/MonthView.tsx` | Lägg till prop, propagera till DayCell |
| `src/components/time-reporting/DayCell.tsx` | Lägg till prop, propagera till popover |
| `src/components/time-reporting/DayDetailPopover.tsx` | Lägg till prop, använd i getUserName |

### Resultat efter fix

- **Dina egna tidposter** → Visas som "Du"
- **Anställdas tidposter** → Visas med deras namn (t.ex. "mahad")
- **Okänt user_id** → Visas som "Okänd" (endast om något är fel)

