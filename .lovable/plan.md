

## Fortnox PAXml-export + Forbattrad loneexportmodul

### Sammanfattning

Bygger ut loneexportmodulen med Fortnox-stod (PAXml-format), forbattrad statusdashboard, smart mapping och 1-klick-export. Allt ska vara lika enkelt for Fortnox som det idag ar for Visma.

---

### Fas 1: MVP (denna implementation)

#### A) Databasandringar

**1. Utoka `salary_types`-tabellen med Fortnox-kolumner:**
- `fortnox_wage_code` (text, nullable) - Fortnox loneart/tidkod
- `fortnox_salary_type` (text, nullable) - Fortnox loneartskod

**2. Utoka `payroll_exports`-tabellen:**
- `provider` (text, default 'visma') - 'visma' eller 'fortnox'
- `export_format` (text, nullable) - 'tlu' eller 'paxml'

**3. Utoka `company_settings`-tabellen:**
- `payroll_provider` (text, nullable) - 'visma', 'fortnox', eller 'both'

**4. Utoka `employees`-tabellen:**
- `fortnox_employee_id` (text, nullable) - anstallningsnummer i Fortnox (om annat an `employment_number`)

#### B) Ny fil: `src/lib/generatePaXmlFile.ts`

Genererar PAXml 2.0-kompatibel XML for Fortnox Lon-import:

```text
<?xml version="1.0" encoding="ISO-8859-1" standalone="yes"?>
<paxml xsi:noNamespaceSchemaLocation="http://www.paxml.se/2.0/paxml.xsd"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <header>
    <version>2.0</version>
    <format>LONIN</format>
    <datum>2026-02-22T10:00:00</datum>
    <foretagid>ORGNR</foretagid>
    <foretagnamn>Foretag AB</foretagnamn>
  </header>
  <tidtransaktioner>
    <tidtrans anstid="101">
      <datum>2026-02-01</datum>
      <tidkod>TIM</tidkod>
      <antal>8.00</antal>
    </tidtrans>
    <!-- fler rader -->
  </tidtransaktioner>
</paxml>
```

Spegling av befintliga `generateTluFile.ts`-monster: `generatePaXmlXml()`, `generatePaXmlFile()`, `downloadPaXmlFile()`, `generatePaXmlFilename()`.

Filnamn: `BYGGIO_FORTNOX_YYYY-MM_ORGNR.xml`

#### C) Uppdatera `src/lib/validatePayrollExport.ts`

- Acceptera `provider`-parameter ('visma' | 'fortnox')
- Validera ratt mappning baserat pa provider:
  - Visma: checka `visma_wage_code`
  - Fortnox: checka `fortnox_wage_code`
- Utoka `TimeEntryForExport.salary_type` med `fortnox_wage_code` och `fortnox_salary_type`
- Utoka `TimeEntryForExport.employee` med `fortnox_employee_id`
- Specifika felmeddelanden per provider: "Lonetyp X saknar Fortnox-tidkod" vs "Visma-tidkod"

#### D) Uppdatera `src/pages/PayrollExport.tsx` - Ny Export-flik

**Statusdashboard (alltid synlig for vald period):**

```text
+--------------------------------------------------+
| Period: februari 2026          [Valj period v]    |
+--------------------------------------------------+
| [x] 42 tidposter                                 |
| [x] Alla attesterade (42/42)                     |
| [x] Alla har mappade lonekoder                   |
| [x] Period last                                  |
+--------------------------------------------------+
| Lonesystem: [Visma v] [Fortnox v]               |
|                                                   |
| [=== Exportera till Visma (.TLU + PDF) ===]      |
| [=== Exportera till Fortnox (.PAXml + PDF) ===]  |
+--------------------------------------------------+
```

- Checklista med ikoner: grona bockar for OK, orangea varningar, roda kryss for blockerande
- Varje checklista-rad ar klickbar/lankad:
  - "X oattesterade" lankar till Attesterings-fliken
  - "X saknar lonekod" lankar till Instellningar > Lonetyper
  - "Period oppen" visar "Las period"-knapp inline
- Export-knappar visas bara nar valt lonesystem ar konfigurerat
- Foretaget valjer standardlonesystem i Instellningar > Foretag, men kan vaxla pa exportsidan

**1-klick-export-flode:**
1. Klick pa "Exportera"
2. Systemet validerar automatiskt
3. Om OK: laser period (om inte redan last) -> genererar filer -> laddar ner -> registrerar export
4. Om fel: visar checklistan med atgarder

#### E) Uppdatera `src/components/settings/SalaryTypeManager.tsx`

Lagg till Fortnox-falten i dialogen, bredvid befintliga Visma-falt:

```text
--- Lonekodsmappning ---
Visma tidkod:  [TIM     ]    Visma loneart: [1010    ]
Fortnox tidkod: [TIM    ]    Fortnox loneart: [1010  ]
Tidtyp: [Ordinarie arbete v]
```

#### F) Uppdatera `src/pages/Settings.tsx` - Foretag-fliken

Lagg till "Lonesystem"-val under foretagsinstallningar:

```text
Lonesystem
(o) Visma Lon 300/600
(o) Fortnox Lon
(o) Bada
```

Spara i `company_settings.payroll_provider`.

#### G) Uppdatera `src/lib/generatePayrollPdf.ts`

- Acceptera `provider`-parameter
- Visa ratt kolumnrubrik i tabellen: "Tidkod (Visma)" eller "Tidkod (Fortnox)"
- Visa ratt loneartkod baserat pa provider
- Metadata visar vilken provider som exporterats

#### H) Uppdatera Visma TLU-filnamn

Fran: `loneexport_YYYYMMDD_YYYYMMDD.tlu`
Till: `BYGGIO_VISMA_YYYY-MM_ORGNR.tlu`

---

### Filer som andras/skapas

| Fil | Andring |
|-----|---------|
| `src/lib/generatePaXmlFile.ts` | **Ny** - PAXml-generator |
| `src/lib/validatePayrollExport.ts` | Utoka med provider-stod |
| `src/lib/generateTluFile.ts` | Uppdatera filnamn |
| `src/lib/generatePayrollPdf.ts` | Provider-aware PDF |
| `src/pages/PayrollExport.tsx` | Statusdashboard + dual export |
| `src/components/settings/SalaryTypeManager.tsx` | Fortnox-falt |
| `src/pages/Settings.tsx` | Lonesystem-val |
| Migration SQL | Nya kolumner |

### Databasmigrering

```sql
-- salary_types: Fortnox-kolumner
ALTER TABLE salary_types ADD COLUMN fortnox_wage_code text;
ALTER TABLE salary_types ADD COLUMN fortnox_salary_type text;

-- payroll_exports: provider-tracking
ALTER TABLE payroll_exports ADD COLUMN provider text DEFAULT 'visma';
ALTER TABLE payroll_exports ADD COLUMN export_format text;

-- company_settings: lonesystem-val
ALTER TABLE company_settings ADD COLUMN payroll_provider text;

-- employees: Fortnox-specifikt ID (om skilt fran employment_number)
ALTER TABLE employees ADD COLUMN fortnox_employee_id text;
```

### Framtida forbattringar (ej i denna iteration)

- Auto-mapping: foreslagna standardkoder nar tidtyp skapas
- Override per tidpost (manuell lonekod pa enskild rad)
- PayrollAdmin-roll for att tillata export utan full attestering
- Fullstandig PAXml med persondata (nyanstallningar etc)
- SIE-filexport for bokforing
- Periodhistorik med visuell tidslinje

