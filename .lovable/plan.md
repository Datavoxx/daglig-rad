

# Plan: Visma Lön 300 TLU-export

## Sammanfattning

Bygga en komplett exportfunktion för att generera löneunderlag till Visma Lön 300 enligt Spiris-specifikationen. Systemet ska validera data före export, generera en `.tlu`-fil (XML i ISO-8859-1) samt skapa PDF som kontrollunderlag.

---

## Fas 1: Databasändringar

### 1.1 Uppdatera `employees`-tabellen

| Nytt fält | Typ | Beskrivning |
|-----------|-----|-------------|
| `employment_number` | text | Anställningsnummer i Visma (primär identifierare) |
| `personal_number` | text | Personnummer YYYYMMDD-XXXX (backup-identifierare) |

```sql
ALTER TABLE employees 
ADD COLUMN employment_number text,
ADD COLUMN personal_number text;
```

### 1.2 Uppdatera `salary_types`-tabellen

| Nytt fält | Typ | Beskrivning |
|-----------|-----|-------------|
| `visma_wage_code` | text | Tidkod för Visma-import |
| `visma_salary_type` | text | Löneart i Visma |
| `time_type` | text | Intern kategori (WORK, OT1, OT2, SICK, VAC, VAB) |

```sql
ALTER TABLE salary_types
ADD COLUMN visma_wage_code text,
ADD COLUMN visma_salary_type text,
ADD COLUMN time_type text DEFAULT 'WORK';
```

### 1.3 Uppdatera `time_entries`-tabellen

| Nytt fält | Typ | Beskrivning |
|-----------|-----|-------------|
| `status` | text | skapad → skickad → attesterad |
| `attested_by` | uuid | Vem som attesterade |
| `attested_at` | timestamp | När den attesterades |
| `export_id` | uuid | Koppling till export-batch |

```sql
ALTER TABLE time_entries
ADD COLUMN status text DEFAULT 'skapad',
ADD COLUMN attested_by uuid,
ADD COLUMN attested_at timestamptz,
ADD COLUMN export_id uuid;
```

### 1.4 Ny tabell: `payroll_periods`

Hanterar periodlåsning per månad.

| Fält | Typ | Beskrivning |
|------|-----|-------------|
| `id` | uuid | PK |
| `user_id` | uuid | Ägarens ID |
| `period_start` | date | Periodens startdatum |
| `period_end` | date | Periodens slutdatum |
| `status` | text | open → locked → exported |
| `locked_at` | timestamp | När perioden låstes |
| `locked_by` | uuid | Vem som låste |

### 1.5 Ny tabell: `payroll_exports`

Spårar varje export för revision.

| Fält | Typ | Beskrivning |
|------|-----|-------------|
| `id` | uuid | PK |
| `user_id` | uuid | Vem som exporterade |
| `period_id` | uuid | FK → payroll_periods |
| `exported_at` | timestamp | Tidpunkt |
| `file_name` | text | TLU-filnamn |
| `pdf_url` | text | URL till PDF-underlag |
| `entry_count` | int | Antal tidposter |
| `total_hours` | numeric | Totalt timmar |
| `employee_count` | int | Antal anställda |

---

## Fas 2: UI-ändringar

### 2.1 Utöka anställd-formuläret

**Fil:** `src/components/settings/EmployeeManager.tsx`

- Lägg till fält för "Anställningsnummer (Visma)" och "Personnummer"
- Visa varningsikon om anställd saknar dessa vid export

### 2.2 Utöka lönetyp-hanteraren

**Fil:** `src/components/settings/SalaryTypeManager.tsx`

- Lägg till fält för "Visma tidkod", "Visma löneart" och "Tidtyp"
- Dropdown för tidtyp: WORK, OT1, OT2, SICK, VAC, VAB

### 2.3 Uppdatera tidsrapporterings-formuläret

**Fil:** `src/pages/TimeReporting.tsx`

- Gör lönetyp obligatorisk
- Visa tydlig varning om lönetyp saknas

### 2.4 Ny attesterings-vy

**Ny fil:** `src/components/time-reporting/AttestationView.tsx`

- Visa tidposter grupperade per anställd
- Markera alla / välj enskilda
- Knapp "Attestera valda"
- Visuell status (badge: Skapad, Skickad, Attesterad)

### 2.5 Ny periodlåsnings-vy

**Ny fil:** `src/components/time-reporting/PeriodLockView.tsx`

- Välj period (månad)
- Visa sammanfattning: antal poster, timmar, anställda
- Knapp "Lås period" (endast om alla poster attesterade)
- Knapp "Lås upp" (kräver bekräftelse)

### 2.6 Ny export-vy

**Ny fil:** `src/pages/PayrollExport.tsx`

Huvudvy för export med följande steg:

1. **Välj period** - Dropdown med låsta perioder
2. **Förhandsgranska** - Tabell med:
   - Antal anställda
   - Antal tidrader
   - Totalt timmar per tidkod
   - Valideringsresultat
3. **Exportera** - Knapp "Ladda ner .TLU"
4. **PDF-underlag** - Automatisk generering

---

## Fas 3: Valideringslogik

**Ny fil:** `src/lib/validatePayrollExport.ts`

Returnerar valideringsresultat med fel och varningar.

### Obligatoriska kontroller:

| Regel | Typ |
|-------|-----|
| Tidpost saknar datum | FEL |
| Tidpost saknar anställd-ID | FEL |
| Tidpost saknar lönetyp | FEL |
| Tidpost har 0 eller negativt värde | FEL |
| Tidpost är oattesterad | FEL |
| Perioden är inte låst | FEL |
| Lönetyp saknar Visma-mappning | FEL |
| Anställd saknar anställningsnummer OCH personnummer | FEL |

---

## Fas 4: TLU-filgenerering

**Ny fil:** `src/lib/generateTluFile.ts`

### XML-struktur (Visma Lön 300/600):

```xml
<?xml version="1.0" encoding="ISO-8859-1"?>
<TransaktionsLista xmlns="http://schemas.spira.se/visma/lon/transaktioner/2.0">
  <TransaktionsRad>
    <AnstNr>1001</AnstNr>
    <Datum>2026-02-04</Datum>
    <TidKod>TIM</TidKod>
    <Antal>8.00</Antal>
  </TransaktionsRad>
</TransaktionsLista>
```

### Viktiga tekniska detaljer:

- **Teckenkodning**: ISO-8859-1 (konvertering från UTF-8)
- **Filändelse**: `.tlu`
- **Decimalformat**: Punkt som decimalavskiljare
- **Datumformat**: YYYY-MM-DD

---

## Fas 5: PDF-underlag

**Ny fil:** `src/lib/generatePayrollPdf.ts`

PDF-dokumentet innehåller:

- Företagslogga och rubrik "LÖNEUNDERLAG"
- Period och exportdatum
- Tabell per anställd med:
  - Datum, Tidkod, Timmar, Beskrivning
- Summering per tidkod
- Totalsumma
- Export-ID för spårbarhet

---

## Fas 6: Navigering och behörigheter

### 6.1 Lägg till ny route

**Fil:** `src/App.tsx`

```tsx
<Route path="/payroll-export" element={<PayrollExport />} />
```

### 6.2 Uppdatera modul-access

**Fil:** `src/hooks/useUserPermissions.ts`

- Lägg till `payroll-export` i `ALL_MODULES`
- ENDAST för admins/ägare (EJ anställda)

### 6.3 Lägg till i sidomenyn

- Ikon: `FileSpreadsheet` från Lucide
- Text: "Löneexport"
- Placering: Under "Tidsrapportering"

---

## Sammanfattning av nya filer

| Fil | Beskrivning |
|-----|-------------|
| `src/pages/PayrollExport.tsx` | Huvudsida för export |
| `src/components/time-reporting/AttestationView.tsx` | Attesterings-UI |
| `src/components/time-reporting/PeriodLockView.tsx` | Periodhantering |
| `src/lib/validatePayrollExport.ts` | Valideringslogik |
| `src/lib/generateTluFile.ts` | TLU-generator |
| `src/lib/generatePayrollPdf.ts` | PDF-generator |

---

## Sammanfattning av databasändringar

| Tabell | Ändring |
|--------|---------|
| `employees` | +2 fält (employment_number, personal_number) |
| `salary_types` | +3 fält (visma_wage_code, visma_salary_type, time_type) |
| `time_entries` | +4 fält (status, attested_by, attested_at, export_id) |
| `payroll_periods` | NY tabell för periodlåsning |
| `payroll_exports` | NY tabell för exporthistorik |

---

## RLS-policyer

Alla nya tabeller får standard RLS:
- `user_id = auth.uid()` för SELECT, INSERT, UPDATE, DELETE

---

## Definition of Done

Funktionen är komplett när:
1. En `.tlu`-fil kan genereras och laddas ner
2. Filen är validerad och följer Spiris-format
3. PDF-underlag skapas automatiskt
4. Perioder kan låsas/låsas upp
5. Attestering fungerar korrekt
6. Export blockeras vid valideringsfel
7. Exporthistorik sparas för revision

