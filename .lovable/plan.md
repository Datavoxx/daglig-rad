

## Implementeringsplan: Lönetyper + Utökad Tidsrapportering + PDF-integration

### Steg 1: Databasmigrering

**Ny migreringsfil:** `supabase/migrations/20260201120000_create_salary_types_and_update_time_entries.sql`

```sql
-- Skapa salary_types tabell
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

-- RLS-policies
CREATE POLICY "Users can view own salary types" ON salary_types FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own salary types" ON salary_types FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own salary types" ON salary_types FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own salary types" ON salary_types FOR DELETE USING (auth.uid() = user_id);

-- Lägg till salary_type_id i time_entries
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS salary_type_id UUID REFERENCES salary_types(id);
```

---

### Steg 2: Ny komponent - SalaryTypeManager

**Ny fil:** `src/components/settings/SalaryTypeManager.tsx`

Kopierar strukturen från `BillingTypeManager.tsx` men med:
- Ikon: `Wallet` istället för `DollarSign`
- Rubrik: "Lönetyper" och "Hantera personalkostnader per yrkesroll"
- Kolumn: "Personalkostnad" istället för "Pris"
- Fält: `hourly_cost` istället för `hourly_rate`

---

### Steg 3: Uppdatera Settings.tsx

Lägg till ny flik "Lönetyper" i TabsList (rad 300-305):

```tsx
<TabsList className="mb-6">
  <TabsTrigger value="mallar">Mallar</TabsTrigger>
  <TabsTrigger value="foretag">Företag</TabsTrigger>
  <TabsTrigger value="anstallda">Anställda</TabsTrigger>
  <TabsTrigger value="debiteringstyper">Debiteringstyper</TabsTrigger>
  <TabsTrigger value="lonetyper">Lönetyper</TabsTrigger>
</TabsList>

// Ny TabsContent
<TabsContent value="lonetyper" className="space-y-6">
  <SalaryTypeManager />
</TabsContent>
```

---

### Steg 4: Utöka TimeReporting.tsx

**Nya tillstånd:**
```tsx
const [selectedBillingType, setSelectedBillingType] = useState<string>("");
const [selectedSalaryType, setSelectedSalaryType] = useState<string>("");
const [selectedEmployee, setSelectedEmployee] = useState<string>("self");
```

**Nya queries:**
```tsx
// Hämta billing_types
const { data: billingTypes = [] } = useQuery({
  queryKey: ["billing_types"],
  queryFn: async () => {
    const ownerId = employerId || user?.id;
    const { data } = await supabase.from("billing_types").select("*").eq("user_id", ownerId).eq("is_active", true);
    return data || [];
  },
});

// Hämta salary_types  
const { data: salaryTypes = [] } = useQuery({
  queryKey: ["salary_types"],
  queryFn: async () => {
    const ownerId = employerId || user?.id;
    const { data } = await supabase.from("salary_types").select("*").eq("user_id", ownerId).eq("is_active", true);
    return data || [];
  },
});

// Hämta anställda (endast för admin/employer)
const { data: employees = [] } = useQuery({
  queryKey: ["employees-for-time"],
  queryFn: async () => {
    if (employerId) return []; // Anställda får inte registrera för andra
    const { data } = await supabase.from("employees").select("*").eq("is_active", true);
    return data || [];
  },
});
```

**Uppdaterad formulär i dialogen:**
```tsx
// Registrera för (endast admin)
{!employerId && employees.length > 0 && (
  <div className="space-y-2">
    <Label>Registrera för</Label>
    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
      <SelectTrigger>
        <SelectValue placeholder="Välj person" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="self">Mig själv</SelectItem>
        {employees.filter(e => e.linked_user_id).map(emp => (
          <SelectItem key={emp.id} value={emp.linked_user_id}>{emp.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)}

// Debiteringstyp
<div className="space-y-2">
  <Label>Debiteringstyp</Label>
  <Select value={selectedBillingType} onValueChange={setSelectedBillingType}>
    <SelectTrigger>
      <SelectValue placeholder="Välj debiteringstyp" />
    </SelectTrigger>
    <SelectContent>
      {billingTypes.map(bt => (
        <SelectItem key={bt.id} value={bt.id}>{bt.name} ({bt.abbreviation})</SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>

// Lönetyp
<div className="space-y-2">
  <Label>Lönetyp</Label>
  <Select value={selectedSalaryType} onValueChange={setSelectedSalaryType}>
    <SelectTrigger>
      <SelectValue placeholder="Välj lönetyp" />
    </SelectTrigger>
    <SelectContent>
      {salaryTypes.map(st => (
        <SelectItem key={st.id} value={st.id}>{st.name} ({st.abbreviation})</SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

**Uppdaterad insert:**
```tsx
const targetUserId = selectedEmployee === "self" ? user.id : selectedEmployee;

const { error } = await supabase.from("time_entries").insert({
  user_id: targetUserId,
  employer_id: employerId || user.id,
  project_id: selectedProject,
  date,
  hours: parseFloat(hours),
  description: description || null,
  billing_type_id: selectedBillingType || null,
  salary_type_id: selectedSalaryType || null,
});
```

**Uppdaterad lista med badges:**
```tsx
{timeEntries.map((entry) => (
  <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
    <div className="space-y-1">
      <div className="font-medium flex items-center gap-2">
        {entry.projects?.name || "Okänt projekt"}
        {entry.billing_types?.abbreviation && (
          <Badge variant="outline" className="text-xs">{entry.billing_types.abbreviation}</Badge>
        )}
        {entry.salary_types?.abbreviation && (
          <Badge variant="secondary" className="text-xs">{entry.salary_types.abbreviation}</Badge>
        )}
      </div>
      <div className="text-sm text-muted-foreground">
        {format(new Date(entry.date), "d MMMM yyyy", { locale: sv })}
        {entry.user_id !== user?.id && ` • Registrerad av admin`}
        {entry.description && ` • ${entry.description}`}
      </div>
    </div>
    ...
  </div>
))}
```

---

### Steg 5: PDF-integration

**Uppdatera gränssnittet i `generateCompleteProjectPdf.ts`:**

```tsx
interface TimeEntry {
  id: string;
  date: string;
  hours: number;
  description: string | null;
  billing_type_name: string | null;
  salary_type_name: string | null;
  user_name: string | null;
}

interface CompleteProjectPdfOptions {
  // ...befintliga fält
  timeEntries: TimeEntry[];
}
```

**Lägg till ny sektion "Tidsrapporter" (efter diary reports):**

```tsx
// === TIME ENTRIES ===
if (timeEntries.length > 0) {
  checkPageBreak(40);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Tidsrapporter", 14, yPos);
  yPos += 10;

  const timeData = timeEntries.map((entry) => [
    formatDate(entry.date),
    entry.user_name || "-",
    entry.hours.toFixed(1) + "h",
    entry.billing_type_name || "-",
    entry.description || "-",
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Datum", "Personal", "Timmar", "Debiteringstyp", "Beskrivning"]],
    body: timeData,
    theme: "striped",
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [60, 60, 60] },
  });

  // Summering
  const totalHours = timeEntries.reduce((sum, e) => sum + e.hours, 0);
  yPos = (doc as any).lastAutoTable.finalY + 5;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Totalt: ${totalHours.toFixed(1)} timmar`, 14, yPos);
  yPos += 15;
}
```

---

### Sammanfattning av filändringar

| Fil | Ändring |
|-----|---------|
| `supabase/migrations/[ny].sql` | Skapa `salary_types`, uppdatera `time_entries` |
| `src/components/settings/SalaryTypeManager.tsx` | **NY** - Hantera lönetyper |
| `src/pages/Settings.tsx` | Lägg till "Lönetyper"-flik + import |
| `src/pages/TimeReporting.tsx` | Debiteringstyp, lönetyp, anställda-dropdown, badges |
| `src/lib/generateCompleteProjectPdf.ts` | Lägg till tidsrapportsektion |

---

### Teknisk information

- **Databas:** salary_types med RLS-policies matchande billing_types
- **Foreign key:** time_entries.salary_type_id → salary_types.id
- **Admin-logik:** Om user saknar `employer_id` i metadata = admin/ägare
- **PDF:** Hämtar time_entries för projektet och visar i tabell

