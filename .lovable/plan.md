

## Plan: Åtgärda högt prioriterade mobilproblem

### 1. Tidsrapportering - Kalendervy för mobil

---

**Problem**

Den nuvarande 7-kolumns grid-layouten (`grid-cols-7`) resulterar i extremt smala celler (~40px bred) på mobila skärmar. Detta gör kalendern oanvändbar.

**Lösning**

Skapa en alternativ **listbaserad vy** för mobil som visar dagarna vertikalt istället för i ett rutnät. På desktop behålls den befintliga kalendervyn.

**Ny mobil layout:**

```
┌────────────────────────────────────────┐
│  Måndag 3 feb                    8.0h  │
│  ├─ Du: 4h på Projekt A                │
│  └─ Erik: 4h på Projekt B              │
├────────────────────────────────────────┤
│  Tisdag 4 feb                    6.5h  │
│  └─ Du: 6.5h på Projekt C              │
├────────────────────────────────────────┤
│  Onsdag 5 feb                      -   │
│  Ingen tid registrerad            [+]  │
└────────────────────────────────────────┘
```

**Tekniska ändringar:**

| Fil | Ändring |
|-----|---------|
| `src/components/time-reporting/MobileDayList.tsx` | **NY FIL** - Listbaserad dagvy för mobil |
| `src/components/time-reporting/WeekView.tsx` | Använd `useIsMobile()` för att välja mellan grid och lista |
| `src/components/time-reporting/MonthView.tsx` | Samma logik - lista på mobil |

**Kod för MobileDayList.tsx:**

```tsx
// Visar varje dag som ett expanderbart kort
// Med tydliga touch-targets (minst 44x44px)
// Inkluderar "+" knapp för att lägga till tid

<div className="space-y-2">
  {days.map(day => (
    <div 
      key={day.dateKey}
      className="p-4 border rounded-lg bg-card"
      onClick={() => onDayClick(day.date)}
    >
      <div className="flex justify-between items-center">
        <div>
          <div className="font-medium">{format(day.date, "EEEE d MMM", { locale: sv })}</div>
          <div className="text-sm text-muted-foreground">
            {day.entries.length} poster
          </div>
        </div>
        <div className="text-xl font-bold text-primary">
          {day.totalHours.toFixed(1)}h
        </div>
      </div>
      {/* Expanderad lista med avatarer och projekt */}
    </div>
  ))}
</div>
```

**Ändringar i WeekView.tsx:**

```tsx
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileDayList } from "./MobileDayList";

export function WeekView({ ... }) {
  const isMobile = useIsMobile();
  
  // Befintlig logik...

  if (isMobile) {
    return (
      <MobileDayList 
        days={weekDays}
        entriesByDate={entriesByDate}
        employees={employees}
        currentUserId={currentUserId}
        onDayClick={onDayClick}
        totalLabel="Totalt denna vecka"
        totalHours={weekTotal}
      />
    );
  }

  // Returnera befintlig desktop-vy
  return (
    <div className="space-y-4">
      {/* Befintlig grid-layout */}
    </div>
  );
}
```

---

### 2. Inställningar - Horisontellt scrollande flikar

---

**Problem**

`TabsList` i Settings-sidan har 6 flikar (Mallar, Företag, Anställda, Debiteringstyper, Lönetyper, Artiklar) men saknar `overflow-x-auto`. På mobil klipps flik-texten och överlappar.

**Lösning**

Lägg till horisontell scrollning på `TabsList` och förkorta flik-texterna för mobil.

**Visuellt före:**

```
│Mallar│Företag│Anställda│Debiteri... (klippt)
```

**Visuellt efter:**

```
│Mallar│Företag│Anställda│ → (scrollbar indikation)
                          ← Deb.typer│Lönetyper│Artiklar
```

**Tekniska ändringar:**

| Fil | Ändring |
|-----|---------|
| `src/pages/Settings.tsx` (rad 302) | Lägg till `overflow-x-auto`, `flex-nowrap` och `justify-start` |

**Kod (rad 301-309):**

```tsx
// FÖRE
<TabsList className="mb-6">
  <TabsTrigger value="mallar">Mallar</TabsTrigger>
  <TabsTrigger value="foretag">Företag</TabsTrigger>
  ...
</TabsList>

// EFTER
<TabsList className="mb-6 w-full justify-start overflow-x-auto flex-nowrap">
  <TabsTrigger value="mallar" className="shrink-0">Mallar</TabsTrigger>
  <TabsTrigger value="foretag" className="shrink-0">Företag</TabsTrigger>
  <TabsTrigger value="anstallda" className="shrink-0">Anställda</TabsTrigger>
  <TabsTrigger value="debiteringstyper" className="shrink-0">Deb.typer</TabsTrigger>
  <TabsTrigger value="lonetyper" className="shrink-0">Lönetyper</TabsTrigger>
  <TabsTrigger value="artiklar" className="shrink-0">Artiklar</TabsTrigger>
</TabsList>
```

**Nyckelklasser:**

| Klass | Funktion |
|-------|----------|
| `overflow-x-auto` | Aktiverar horisontell scrollning |
| `flex-nowrap` | Förhindrar att flikar radbryts |
| `justify-start` | Vänsterjusterar flikarna |
| `shrink-0` | Förhindrar att individuella flikar krymper |

**Förkortade etiketter:**

| Nuvarande | Förkortad |
|-----------|-----------|
| Debiteringstyper | Deb.typer |

---

### Sammanfattning av filer

| Fil | Typ | Beskrivning |
|-----|-----|-------------|
| `src/components/time-reporting/MobileDayList.tsx` | **NY** | Listbaserad mobil-vy för tidsrapportering |
| `src/components/time-reporting/WeekView.tsx` | Ändrad | Villkorlig rendering baserat på `useIsMobile()` |
| `src/components/time-reporting/MonthView.tsx` | Ändrad | Samma villkorliga rendering |
| `src/pages/Settings.tsx` | Ändrad | Scrollbara flikar med `overflow-x-auto` |

---

### Prioriteringsordning

1. **Settings-flikar** (5 min) - Enkel CSS-ändring
2. **MobileDayList komponent** (20 min) - Ny komponent
3. **WeekView/MonthView integration** (10 min) - Villkorlig rendering

