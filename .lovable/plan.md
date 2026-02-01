

## Plan: Förbättrad Dagvy med Poster och Avatarer

### Vad som ska göras

1. **Klick på dag visar poster** - När man klickar på en dag som har registreringar ska en popover/panel öppnas som visar alla poster för den dagen
2. **Avatarer för personer** - Visa små avatarer med initialer i dagcellen för att visa vilka som arbetat
3. **Detaljerad postlista** - Visa varje post med personens namn, projekt, timmar och eventuell beskrivning

---

### Ny design för dagcellen

```
┌────────────────────────┐
│ 1                  [+] │  ← Dagnummer och lägg till-knapp
│                        │
│   15.5h               │  ← Totala timmar
│   ○ ○                 │  ← Avatarer för personer (max 3 + "...")
│   2 poster            │  ← Antal poster
└────────────────────────┘
```

**Vid klick på cellen:**
```
┌─────────────────────────────────┐
│ 1 februari 2026                 │
│ ─────────────────────────────── │
│                                 │
│ ○ Admin                   7.5h  │
│   Fasadmålning Marstrand       │
│   "30min lunch"                │
│                                 │
│ ○ Mahad                   8.0h  │
│   Fasadmålning Marstrand       │
│                                 │
│ ─────────────────────────────── │
│ Totalt: 15.5h                   │
│          [+ Lägg till tid]      │
└─────────────────────────────────┘
```

---

### Tekniska ändringar

#### 1. Uppdatera TimeCalendarView.tsx

Hämta mer data i queryn:
```typescript
// Nuvarande
.select("id, date, hours, project_id")

// Ny
.select(`
  id, date, hours, project_id, user_id, description,
  projects:project_id(name),
  billing_types:billing_type_id(abbreviation),
  salary_types:salary_type_id(abbreviation)
`)
```

Skicka även employees-data till vyn för att kunna matcha user_id mot namn.

#### 2. Uppdatera DayCell.tsx

- Ta emot `entries` (array av poster) istället för bara `hours` och `entryCount`
- Ta emot `employees` för namnmatchning
- Visa avatarer för unika personer
- Gör hela cellen klickbar för att visa popover med detaljer

#### 3. Ny komponent: DayDetailPopover.tsx

- Visar listan av poster för en specifik dag
- Varje post visar: avatar, namn, projekt, timmar, beskrivning
- Summering i botten
- Knapp för att lägga till ny post

---

### Filändringar

| Fil | Ändring |
|-----|---------|
| `TimeCalendarView.tsx` | Utöka query med relations, hämta employees |
| `WeekView.tsx` | Skicka entries + employees till DayCell |
| `MonthView.tsx` | Skicka entries + employees till DayCell |
| `DayCell.tsx` | Visa avatarer, hantera klick för popover |
| `DayDetailPopover.tsx` (NY) | Visa detaljerad lista för en dag |

---

### UX-förbättringar

1. **Avatarer** - Cirkulära ikoner med initialer och färg baserad på namn
2. **Staplingsindikator** - Om fler än 3 personer visas "+2" för resten
3. **Snabb överblick** - Ser direkt vilka som arbetat utan att klicka
4. **Detaljerad vy** - All information på ett ställe vid klick
5. **Snabb registrering** - Knapp i popovern för att lägga till tid

