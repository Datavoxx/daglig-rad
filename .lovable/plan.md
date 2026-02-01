

## Plan: Lönetyper + Utökad Tidsrapportering + PDF-integration

### Sammanfattning
Lägga till "Lönetyper" (parallellt med Debiteringstyper), utöka tidsrapporteringen så admin kan registrera tid för sina anställda, och inkludera tidsdata i projektets PDF-sammanställning.

---

### Del 1: Ny Tabell - Lönetyper (salary_types)

En ny tabell som speglar `billing_types` men med personalkostnad istället för timpris.

| Kolumn | Typ | Beskrivning |
|--------|-----|-------------|
| id | uuid | Primärnyckel |
| user_id | uuid | Ägarens ID |
| name | text | T.ex. "Snickare", "Målare" |
| abbreviation | text | Förkortning, t.ex. "SNI" |
| hourly_cost | numeric | Personalkostnad per timme |
| sort_order | integer | Sortering |
| is_active | boolean | Om typen är aktiv |

**RLS-policies:** Samma mönster som `billing_types` (CRUD för egen data).

---

### Del 2: Uppdatera time_entries

Lägg till kolumn för lönetyp:

| Ny kolumn | Typ | Beskrivning |
|-----------|-----|-------------|
| salary_type_id | uuid | Länk till lönetyp |

---

### Del 3: Inställningar - Ny flik "Lönetyper"

**Ny komponent:** `src/components/settings/SalaryTypeManager.tsx`

Baseras på `BillingTypeManager.tsx` men med:
- "Personalkostnad" istället för "Timpris"
- Samma UI-mönster (tabell med namn, förkortning, kostnad, sortering, status, redigera/ta bort)

**Uppdatera `Settings.tsx`:**
- Lägg till ny flik "Lönetyper" i TabsList

---

### Del 4: Utökad Tidsrapportering

**Uppdatera `TimeReporting.tsx`:**

1. **Lägg till dropdowns för:**
   - Debiteringstyp (billing_type_id)
   - Lönetyp (salary_type_id)

2. **Admin kan registrera tid för anställda:**
   - Ny dropdown "Registrera för" med lista av anställda
   - Om admin väljer en anställd → använd anställdas `linked_user_id` som `user_id`
   - Admin behåller sin `employer_id` för att kunna se posten

3. **Visa i listan:**
   - Debiteringstyp (badge)
   - Lönetyp (badge)
   - Vem som registrerade (om det är för annan person)

---

### Del 5: PDF-integration

**Uppdatera `generateCompleteProjectPdf.ts`:**

Lägg till ny sektion "Tidsrapporter" med:
- Datum | Personal | Timmar | Debiteringstyp | Beskrivning
- Summering: Total tid, total kostnad

---

### Databasmigrering

```sql
-- 1. Skapa salary_types tabell
CREATE TABLE public.salary_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  hourly_cost NUMERIC DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE salary_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own salary types" ON salary_types
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Lägg till salary_type_id i time_entries
ALTER TABLE time_entries ADD COLUMN salary_type_id UUID;
```

---

### Implementationsordning

```text
┌─────────────────────────────────────────────────────────┐
│ Steg 1: Databasmigrering                                │
│ - Skapa salary_types tabell                             │
│ - Lägg till salary_type_id i time_entries               │
└────────────────────────┬────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────┐
│ Steg 2: SalaryTypeManager komponent                     │
│ - Kopiera och anpassa från BillingTypeManager           │
│ - Uppdatera Settings.tsx med ny flik                    │
└────────────────────────┬────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────┐
│ Steg 3: Utöka TimeReporting                             │
│ - Lägg till val av debiteringstyp + lönetyp             │
│ - Admin kan välja anställd att registrera för           │
│ - Visa typer i listan                                   │
└────────────────────────┬────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────┐
│ Steg 4: PDF-integration                                 │
│ - Uppdatera generateCompleteProjectPdf.ts               │
│ - Lägg till tidsrapportsektion                          │
└─────────────────────────────────────────────────────────┘
```

---

### Filöversikt

| Fil | Ändring |
|-----|---------|
| `supabase/migrations/[ny].sql` | Skapa `salary_types`, uppdatera `time_entries` |
| `src/components/settings/SalaryTypeManager.tsx` | **NY** - Hantera lönetyper |
| `src/pages/Settings.tsx` | Lägg till "Lönetyper"-flik |
| `src/pages/TimeReporting.tsx` | Debiteringstyp, lönetyp, anställda-dropdown |
| `src/lib/generateCompleteProjectPdf.ts` | Lägg till tidsrapportsektion |

---

### UI-flöde för Tidsrapportering (efter implementation)

```text
┌─────────────────────────────────────────────────────────┐
│  REGISTRERA TID                                         │
├─────────────────────────────────────────────────────────┤
│  Registrera för:    [Admin själv ▼]  (anställda lista)  │
│                                                         │
│  Projekt:           [Välj projekt ▼]                    │
│                                                         │
│  Datum:  [2026-02-01]    Timmar: [8]                   │
│                                                         │
│  Debiteringstyp:    [Snickare ▼]                       │
│  Lönetyp:           [Snickare ▼]                       │
│                                                         │
│  Beskrivning:       [________________]                  │
│                                                         │
│                              [Spara]                    │
└─────────────────────────────────────────────────────────┘
```

---

### Resultat

Efter implementation:
1. **Inställningar** → Ny flik "Lönetyper" för att hantera personalkostnader
2. **Tidsrapportering** → Val av debiteringstyp och lönetyp vid registrering
3. **Admin** → Kan registrera tid för sina anställda
4. **PDF** → Tidsrapporter inkluderas i projektsammanställning med typer och summor

