
## Implementeringsplan: Kalendervy för Tidsrapportering + Projektintegrering

### Översikt
Denna plan täcker tre huvudsakliga förbättringar:
1. Säkerställa att lönetyp visas i registreringsformuläret
2. Lägg till kalendervy (vecka/månad) i tidsrapporteringssidan
3. Lägg till tidsrapporteringssektion i projektvyn

---

### Del 1: Kontrollera Lönetyper i Formuläret

**Status:** Koden har redan stöd för lönetyper (rad 317-333 i TimeReporting.tsx), men dropdown visas endast om `salaryTypes.length > 0`. Detta betyder att användaren måste skapa lönetyper i Inställningar först.

**Åtgärd:** Ingen kodändring behövs - funktionen finns. Vi kan dock förbättra UX genom att alltid visa dropdown med en tom option.

---

### Del 2: Kalendervy i Tidsrapportering

**Ny komponent:** `src/components/time-reporting/TimeCalendarView.tsx`

**Funktionalitet:**
- Toggle mellan "Vecka" och "Månad" läge
- Veckoläge: Visar 7 dagar horisontellt (mån-sön) med staplar för timmar per dag
- Månadsläge: Visar kalendergrid med totala timmar per dag i varje cell
- Klicka på en dag öppnar modal för att registrera tid för det datumet
- Summering av totala timmar för vald period

**Designreferens (baserat på Bygglet-stil):**
```
+-----------------------------------------------+
| < Januari 2026              [Vecka] [Månad] > |
+-----------------------------------------------+
| Mån    | Tis    | Ons    | Tor    | Fre    |...|
|--------|--------|--------|--------|--------|
| 1      | 2      | 3      | 4      | 5      |
| 8.0h   | 6.5h   | -      | 7.0h   | 8.0h   |
| [+]    | [+]    | [+]    | [+]    | [+]    |
|--------|--------|--------|--------|--------|
| ...fler rader...                             |
+-----------------------------------------------+
| Totalt denna månad: 156.5 timmar             |
+-----------------------------------------------+
```

**Implementation:**
1. Skapa komponent med vecko/månad-toggle
2. Hämta time_entries för vald period
3. Gruppera per datum och summera timmar
4. Visa i grid-layout med dag-celler
5. Klick på dag = öppna registreringsformuläret med förifyllt datum

---

### Del 3: Tidsrapportering i Projektvy

**Ny komponent:** `src/components/projects/ProjectTimeSection.tsx`

**Placering:** Under "Ekonomisk översikt" i ProjectOverviewTab

**Funktionalitet:**
- Collapsible sektion med rubrik "Tidsrapportering"
- Sammanfattning: Totalt antal timmar, antal poster, antal personer
- Mini-kalendervy som visar senaste 4 veckorna
- Klicka för att expandera och se detaljerad kalendervy
- Snabbknapp för att registrera tid (förifyller projekt automatiskt)

**Design:**
```
+-----------------------------------------------+
| Tidsrapportering               [+ Registrera] |
| Arbetad tid på projektet            [Expand]  |
+-----------------------------------------------+
| Totalt: 124.5h | Poster: 18 | Personer: 3     |
+-----------------------------------------------+
| v.1  | v.2  | v.3  | v.4  |                   |
| 32h  | 40h  | 28h  | 24.5h|  (mini-staplar)   |
+-----------------------------------------------+
```

**Expanderad vy (Dialog/Sheet):**
- Full kalendervy filtrerad på detta projekt
- Lista över alla tidsposter för projektet
- Möjlighet att redigera/ta bort poster

---

### Filstruktur

**Nya filer:**
```
src/components/time-reporting/
  ├── TimeCalendarView.tsx       # Huvudkalenderkomponent
  ├── WeekView.tsx               # Veckovisning
  ├── MonthView.tsx              # Månadsvisning
  └── DayCell.tsx                # Dagcell med timmar

src/components/projects/
  └── ProjectTimeSection.tsx     # Tidssektion i projektvy
```

**Ändringar i befintliga filer:**
```
src/pages/TimeReporting.tsx      # Lägg till kalendervy ovanför listan
src/components/projects/ProjectOverviewTab.tsx  # Lägg till TimeSection
```

---

### Teknisk implementation

**TimeCalendarView.tsx:**
```typescript
// State för visningsläge
const [viewMode, setViewMode] = useState<"week" | "month">("week");
const [currentDate, setCurrentDate] = useState(new Date());

// Query för att hämta entries för perioden
const { data: entries } = useQuery({
  queryKey: ["time-entries-calendar", currentDate, viewMode],
  queryFn: async () => {
    const start = viewMode === "week" 
      ? startOfWeek(currentDate, { locale: sv })
      : startOfMonth(currentDate);
    const end = viewMode === "week"
      ? endOfWeek(currentDate, { locale: sv })
      : endOfMonth(currentDate);
    
    return supabase
      .from("time_entries")
      .select("*")
      .gte("date", format(start, "yyyy-MM-dd"))
      .lte("date", format(end, "yyyy-MM-dd"));
  }
});

// Gruppera per datum
const entriesByDate = useMemo(() => {
  return entries?.reduce((acc, entry) => {
    const date = entry.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, TimeEntry[]>);
}, [entries]);
```

**ProjectTimeSection.tsx:**
```typescript
// Hämta time_entries för projektet
const { data: projectTimeEntries } = useQuery({
  queryKey: ["project-time-entries", projectId],
  queryFn: async () => {
    return supabase
      .from("time_entries")
      .select(`
        *,
        billing_types:billing_type_id(name, abbreviation),
        salary_types:salary_type_id(name, abbreviation)
      `)
      .eq("project_id", projectId)
      .order("date", { ascending: false });
  }
});

// Beräkna statistik
const stats = useMemo(() => ({
  totalHours: entries.reduce((sum, e) => sum + Number(e.hours), 0),
  totalEntries: entries.length,
  uniqueUsers: new Set(entries.map(e => e.user_id)).size
}), [entries]);
```

---

### Sammanfattning av ändringar

| Fil | Typ | Beskrivning |
|-----|-----|-------------|
| `TimeCalendarView.tsx` | NY | Kalenderkomponent med vecka/månad toggle |
| `WeekView.tsx` | NY | Veckovisning med dagceller |
| `MonthView.tsx` | NY | Månadsvisning i grid |
| `DayCell.tsx` | NY | Återanvändbar dagcell med timvisning |
| `ProjectTimeSection.tsx` | NY | Tidsrapporteringssektion för projekt |
| `TimeReporting.tsx` | ÄNDRA | Integrera kalendervy |
| `ProjectOverviewTab.tsx` | ÄNDRA | Lägg till TimeSection |

---

### UX-förbättringar inkluderade

1. **Snabb registrering** - Klicka på dag i kalender → formulär öppnas med datum förifyllt
2. **Projektkontext** - I projektvyn är projekt automatiskt valt vid registrering
3. **Visuell överblick** - Färgkodade staplar visar arbetsbelastning per dag
4. **Responsivt** - Mobilvänlig design med swipe för att byta vecka/månad
5. **Sammanfattningar** - Totaler synliga utan att behöva scrolla

---

### Databeroenden

- Använder befintlig `time_entries` tabell
- Använder `billing_types` och `salary_types` för metadata
- Ingen ny databasmigration behövs
