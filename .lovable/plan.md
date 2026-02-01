

## Personalliggare - Svensk lagefterlevnad för byggbranschen

### Bakgrund

**Personalliggare** är ett svenskt lagkrav för byggbranschen där arbetsgivare måste föra register över vilka personer som befinner sig på en arbetsplats vid varje given tidpunkt. Detta ska kunna visas för Skatteverket vid kontroll.

**Skillnad mot Tidsrapportering:**

| Personalliggare | Tidsrapportering |
|-----------------|------------------|
| Lagkrav - exakt in/ut-tid | Intern uppföljning |
| Inga timberäkningar | Timmar, lön, fakturering |
| Enkel och ren data | Kopplat till projekt, typer |
| Redo för myndighetskontroll | Ekonomisk analys |

---

### Databasstruktur

Ny tabell: `attendance_records`

| Kolumn | Typ | Beskrivning |
|--------|-----|-------------|
| id | uuid | Primärnyckel |
| user_id | uuid | Person som checkar in (anställd eller admin) |
| employer_id | uuid | Arbetsgivare/organisation |
| project_id | uuid | Arbetsplats/projekt |
| check_in | timestamptz | Incheckningstid (exakt) |
| check_out | timestamptz | Utcheckningstid (null = fortfarande på plats) |
| created_at | timestamptz | Skapad |

**RLS-policyer:**
- Användare kan se/hantera sina egna poster
- Arbetsgivare kan se/hantera anställdas poster (via employer_id)

---

### Användargränssnitt

#### Huvudvy: `/attendance`

```text
┌─────────────────────────────────────────────────────────────┐
│  PERSONALLIGGARE                                            │
│  Elektronisk närvaro för [Projektnamn]                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐   ┌─────────────────────────────────┐  │
│  │  VÄLJ PROJEKT   │   │  PÅ PLATS JUST NU: 3 personer   │  │
│  │  [▼ Dropdown]   │   │  ─────────────────────────────  │  │
│  └─────────────────┘   │  ● Erik S. - sedan 07:15        │  │
│                        │  ● Anna K. - sedan 07:30        │  │
│  ┌─────────────────┐   │  ● Johan L. - sedan 08:00       │  │
│  │   CHECKA IN     │   └─────────────────────────────────┘  │
│  │   [Stor knapp]  │                                        │
│  └─────────────────┘                                        │
│                                                             │
│  ┌─────────────────┐                                        │
│  │   CHECKA UT     │   Grå om ej incheckad                  │
│  │   [Stor knapp]  │                                        │
│  └─────────────────┘                                        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  HISTORIK (senaste 7 dagar)                                 │
│  ─────────────────────────────────────────────────────────  │
│  2026-02-01  Erik S.     07:15 - 16:30                      │
│  2026-02-01  Anna K.     07:30 - 16:45                      │
│  2026-01-31  Erik S.     06:45 - 15:30                      │
│  ...                                                        │
│                                 [Exportera för kontroll →]  │
└─────────────────────────────────────────────────────────────┘
```

#### Flöde

1. **Användaren väljer projekt** (arbetsplats)
2. **Ett klick: Checka in** - sparar aktuell tid + projekt
3. **Ett klick: Checka ut** - uppdaterar posten med utcheckningstid
4. **Realtidsvy** visar vem som är på plats just nu (check_out = null)
5. **Historik** visar de senaste dagarna för dokumentation

---

### Navigation

Lägg till ny navigeringspost i `AppLayout.tsx`:

```typescript
{ 
  label: "Personalliggare", 
  href: "/attendance", 
  icon: ClipboardCheck,  // eller UserCheck 
  moduleKey: "attendance" 
}
```

Placeras logiskt nära "Tidsrapport" men är en separat modul.

---

### Teknisk implementation

#### 1. Databasmigration

```sql
CREATE TABLE attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  employer_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES projects(id),
  check_in timestamptz NOT NULL DEFAULT now(),
  check_out timestamptz,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own attendance"
  ON attendance_records FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Employers can view employee attendance"
  ON attendance_records FOR SELECT
  USING (auth.uid() = employer_id);

CREATE POLICY "Employers can manage employee attendance"
  ON attendance_records FOR ALL
  USING (auth.uid() = employer_id)
  WITH CHECK (auth.uid() = employer_id);

-- Index för snabba frågor
CREATE INDEX idx_attendance_project ON attendance_records(project_id);
CREATE INDEX idx_attendance_employer ON attendance_records(employer_id);
CREATE INDEX idx_attendance_active ON attendance_records(user_id) 
  WHERE check_out IS NULL;
```

#### 2. Nya filer

| Fil | Beskrivning |
|-----|-------------|
| `src/pages/Attendance.tsx` | Huvudsida med in/ut-knappar |
| `src/components/attendance/ActiveWorkers.tsx` | Lista över vem som är på plats |
| `src/components/attendance/AttendanceHistory.tsx` | Historik-tabell |

#### 3. Uppdatera routing

**App.tsx:**
```typescript
import Attendance from "@/pages/Attendance";
// ...
<Route path="/attendance" element={
  <ProtectedModuleRoute module="attendance">
    <Attendance />
  </ProtectedModuleRoute>
} />
```

#### 4. Uppdatera behörigheter

**useUserPermissions.ts:**
```typescript
const ALL_MODULES = [
  // ... befintliga
  "attendance"  // NY
];
```

**handle_new_user() trigger:**
```sql
-- Lägg till 'attendance' i modules-arrayen
```

---

### Viktiga designprinciper

1. **Enkelhet** - Minimalt med fält, bara det som krävs enligt lag
2. **Snabbhet** - Ett klick för in, ett klick för ut
3. **Realtid** - Alltid aktuell vy av vem som är på plats
4. **Ingen koppling till ekonomi** - Helt separerad från tidsrapportering
5. **Exporterbart** - Möjlighet att exportera för Skatteverket

---

### Mobilvänlighet

Stora knappar för "Checka in" / "Checka ut" som fungerar bra på mobil direkt på arbetsplatsen.

---

### Sammanfattning av filer som skapas/ändras

**Nya filer:**
- `src/pages/Attendance.tsx`
- `src/components/attendance/ActiveWorkers.tsx`
- `src/components/attendance/AttendanceHistory.tsx`

**Filer som uppdateras:**
- `src/App.tsx` (ny route)
- `src/components/layout/AppLayout.tsx` (ny nav-post)
- `src/hooks/useUserPermissions.ts` (ny modul)

**Databasmigration:**
- Ny tabell `attendance_records`
- RLS-policyer
- Index för prestanda

