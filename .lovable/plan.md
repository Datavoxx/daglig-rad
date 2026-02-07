

## Mål

Utöka "Ny dagrapport"-formuläret i Byggio AI (`DailyReportFormCard.tsx`) så att det inkluderar alla sektioner som visas i referensbilden - matchande det fullständiga `ReportEditor`-gränssnittet.

---

## Nuvarande vs Önskat

| Sektion | Nuvarande | Efter ändring |
|---------|-----------|---------------|
| Projekt | Dropdown | Dropdown (behålls) |
| Bemanning | Enkel: "Personal" + "Totalt timmar" | Antal personer, Timmar/person, Roller, Totala timmar (beräknad) |
| Utfört arbete | Ett textfält | Lista med + knapp för flera arbetsmoment |
| Avvikelser | Saknas | Lista med typ-dropdown, beskrivning, timmar |
| ÄTA | Saknas | Lista med anledning, konsekvens, uppskattade timmar |
| Material | Saknas | Levererat + Saknas (två fält) |
| Övrigt | Saknas | Textfält för anteckningar |

---

## Ändringar

### 1. Frontend: Expandera `DailyReportFormCard.tsx`

Bygg om komponenten med alla sektioner:

```
┌──────────────────────────────────────────────┐
│  📋 Ny dagrapport                            │
├──────────────────────────────────────────────┤
│  Projekt: [Dropdown...]                      │
├─────────────────────┬────────────────────────┤
│  👥 BEMANNING       │  🔧 UTFÖRT ARBETE      │
│  Antal: [1]         │  [Item 1]          [x] │
│  Tim/pers: [8]      │  [Item 2]          [x] │
│  Roller: [input]    │  [+ Lägg till]         │
│  ────────────────── │                        │
│  ⏱️ Totalt: 8h      │                        │
├─────────────────────┼────────────────────────┤
│  ⚠️ AVVIKELSER      │  📄 ÄTA               │
│  Inga avvikelser... │  Inga ÄTA...          │
│  [+ Lägg till]      │  [+ Lägg till]        │
├─────────────────────┴────────────────────────┤
│  📦 MATERIAL                                 │
│  Levererat: [T.ex. virke, gipsskivor...]    │
│  Saknas: [T.ex. beslag, el-material...]     │
├──────────────────────────────────────────────┤
│  📝 ÖVRIGT / ANTECKNINGAR                    │
│  [Övriga kommentarer...]                     │
├──────────────────────────────────────────────┤
│                     [Avbryt] [Spara rapport] │
└──────────────────────────────────────────────┘
```

**Ny datastruktur:**
```typescript
interface DailyReportFormData {
  projectId: string;
  crew: {
    headcount: number;
    hoursPerPerson: number;
    roles: string[];
    totalHours: number;
  };
  workItems: string[];
  deviations: Array<{
    type: string;
    description: string;
    hours: number | null;
  }>;
  ata: Array<{
    reason: string;
    consequence: string;
    estimatedHours: number | null;
  }>;
  materials: {
    delivered: string[];
    missing: string[];
  };
  notes: string;
}
```

### 2. Backend: Uppdatera `create_daily_report` tool

**Tool definition:**
```typescript
{
  name: "create_daily_report",
  parameters: {
    properties: {
      project_id: { type: "string" },
      headcount: { type: "number" },
      hours_per_person: { type: "number" },
      roles: { type: "array", items: { type: "string" } },
      work_items: { type: "array", items: { type: "string" } },
      deviations: { type: "array", items: { type: "object" } },
      ata: { type: "object" },
      materials_delivered: { type: "array", items: { type: "string" } },
      materials_missing: { type: "array", items: { type: "string" } },
      notes: { type: "string" },
    },
    required: ["project_id"],
  },
}
```

**Implementation:**
```typescript
case "create_daily_report": {
  const { data, error } = await supabase
    .from("daily_reports")
    .insert({
      user_id: userId,
      project_id,
      headcount,
      hours_per_person: hours_per_person || null,
      total_hours: headcount && hours_per_person 
        ? headcount * hours_per_person 
        : total_hours,
      roles: roles || [],
      work_items: work_items || [],
      deviations: deviations || [],
      ata: ata || null,
      materials_delivered: materials_delivered || [],
      materials_missing: materials_missing || [],
      notes: notes || null,
      report_date: new Date().toISOString().split('T')[0],
    })
    .select()
    .single();
  // ...
}
```

### 3. Frontend: Uppdatera `GlobalAssistant.tsx`

Anpassa submit-hanteraren för den nya datastrukturen:

```typescript
const handleDailyReportFormSubmit = async (formData: DailyReportFormData) => {
  // Skicka strukturerad data till backend
  await sendMessage(
    `Skapa dagrapport för projekt ${formData.projectId}`,
    { dailyReportData: formData }
  );
};
```

### 4. Frontend: Uppdatera `MessageList.tsx`

Uppdatera props-typen för den nya komponenten.

---

## Filer att ändra

| Fil | Ändring |
|-----|---------|
| `src/components/global-assistant/DailyReportFormCard.tsx` | Total omskrivning med alla sektioner |
| `src/pages/GlobalAssistant.tsx` | Uppdatera submit-hanteraren |
| `src/components/global-assistant/MessageList.tsx` | Uppdatera props-typer |
| `supabase/functions/global-assistant/index.ts` | Uppdatera tool definition + implementation |

---

## UI/UX-detaljer

- Behåll samma visuella stil som `ReportEditor.tsx`
- Använd Cards för varje sektion
- Ikoner: Users (bemanning), Hammer (arbete), AlertTriangle (avvikelser), FileWarning (ÄTA), Package (material), FileText (anteckningar)
- Tom-state med "Inga X registrerade" + "Lägg till"-knapp
- Responsivt grid-layout (2 kolumner på desktop, 1 på mobil)
- Beräkna "Totala timmar" automatiskt från antal × timmar/person

---

## Resultat

1. Användare får ett komplett dagrapportformulär direkt i chatten
2. Alla fält sparas korrekt till databasen
3. Samma struktur som i projekt-vyn för konsistens
4. Snabbare workflow utan att behöva navigera till separat sida

