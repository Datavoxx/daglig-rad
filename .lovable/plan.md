

## Implementeringsplan: Lönetyper + Utökad Tidsrapportering + PDF-integration

### Översikt
Jag kommer implementera alla funktioner som beskrivs i den godkända planen. Databastabellen `salary_types` och kolumnen `salary_type_id` i `time_entries` finns redan i databasen, så vi fokuserar på frontend-implementeringen.

---

### Steg 1: Ny komponent - SalaryTypeManager

**Fil:** `src/components/settings/SalaryTypeManager.tsx`

En fullständig CRUD-komponent baserad på `BillingTypeManager.tsx` men anpassad för lönetyper:
- Ikon: `Wallet` istället för `DollarSign`
- Rubrik: "Lönetyper" och "Hantera personalkostnader per yrkesroll"
- Kolumn: "Kostnad" istället för "Pris"
- Fält: `hourly_cost` istället för `hourly_rate`

---

### Steg 2: Uppdatera Settings.tsx

1. Lägg till import för `SalaryTypeManager`
2. Lägg till ny TabsTrigger "Lönetyper"
3. Lägg till ny TabsContent som renderar `SalaryTypeManager`

---

### Steg 3: Utöka TimeReporting.tsx

Stora uppdateringar:

1. **Nya tillstånd:**
   - `selectedBillingType` - vald debiteringstyp
   - `selectedSalaryType` - vald lönetyp
   - `selectedEmployee` - vald anställd (för admin)

2. **Nya queries:**
   - Hämta billing_types för ägarens konto
   - Hämta salary_types för ägarens konto
   - Hämta anställda (endast för admin/ägare)

3. **Formuläruppdateringar:**
   - "Registrera för" dropdown (admin kan välja anställd)
   - "Debiteringstyp" dropdown
   - "Lönetyp" dropdown

4. **Lista med badges:**
   - Visa debiteringstyp-badge
   - Visa lönetyp-badge
   - Indikation om registrerad för annan person

---

### Steg 4: PDF-integration

**Fil:** `src/lib/generateCompleteProjectPdf.ts`

1. Lägg till `TimeEntry` interface
2. Uppdatera `CompleteProjectPdfOptions` med `timeEntries`
3. Lägg till sektion "Tidsrapporter" med:
   - Tabell: Datum | Personal | Timmar | Debiteringstyp | Beskrivning
   - Summering av totala timmar

---

### Filändringar

| Fil | Typ | Ändring |
|-----|-----|---------|
| `src/components/settings/SalaryTypeManager.tsx` | NY | CRUD för lönetyper |
| `src/pages/Settings.tsx` | ÄNDRA | Import + ny flik |
| `src/pages/TimeReporting.tsx` | ÄNDRA | Utökad funktionalitet |
| `src/lib/generateCompleteProjectPdf.ts` | ÄNDRA | Tidsrapportsektion |

---

### Resultat efter implementation

1. **Inställningar → Lönetyper:** Hantera personalkostnader per yrkesroll
2. **Tidsrapportering:** Val av debiteringstyp och lönetyp vid registrering
3. **Admin-funktion:** Kan registrera tid för sina anställda
4. **PDF-rapport:** Tidsrapporter inkluderas automatiskt

