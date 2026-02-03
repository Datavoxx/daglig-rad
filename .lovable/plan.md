

## Plan: Utöka projektrapporten med detaljerad information

### Identifierade problem

| Sektion | Problem | Lösning |
|---------|---------|---------|
| Projektplanering | Saknar fasbeskrivningar | Lägg till `description` för varje fas |
| Arbetsdagbok | Kompakt, visar bara 2 work_items | Visa ALL data: roller, timmar/person, avvikelser, material, anteckningar |
| Arbetsorder | Saknar beskrivning | Lägg till `description`-kolumn |
| Projektfiler | Bara filnamn, ingen förhandsgranskning | Bädda in bilder direkt i PDF:en |

---

## Lösning

### 1. Projektplanering - Lägg till fasbeskrivningar

**Nuvarande kod (rad 325-347):**
```typescript
const planData = plan.phases.map((phase, index) => [
  `Fas ${index + 1}`,
  phase.name,
  `Vecka ${phase.start_week}`,
  `${phase.duration_weeks} veckor`,
]);
```

**Ny struktur:**
- Behåll tabellen för översikt
- Lägg till "FASDETALJER"-sektion efter tabellen (som i planerings-PDF:en)
- Visa `description` för varje fas

**Ändringar:**
1. Uppdatera `Phase` interface med `description?: string | null`
2. Efter tabellen, loopa genom faserna och visa:
   - Fasnamn + vecka
   - Beskrivning (om den finns)

---

### 2. Arbetsdagbok - Visa full information

**Nuvarande struktur:**
```typescript
interface DiaryReport {
  id, report_date, headcount, total_hours, work_items, notes
}
```

**Saknas i interface:**
- `roles` - vilka roller som arbetade
- `hours_per_person` - timmar per person
- `deviations` - avvikelser
- `extra_work` - extraarbete
- `materials_delivered` - levererat material
- `materials_missing` - saknat material

**Lösning:**
1. Utöka `DiaryReport` interface med alla fält
2. Ge varje dagrapport en egen sektion med:
   - Datum, personal, timmar
   - Lista: "Utfört arbete" (alla work_items)
   - Lista: "Avvikelser" (om finns)
   - Lista: "Extraarbete" (om finns)
   - Lista: "Material" (levererat/saknat)
   - Text: "Anteckningar" (notes)

**Ny layout per rapport:**
```text
┌─────────────────────────────────────────────────────────┐
│ 3 februari 2026                                         │
│ Personal: 8 • Timmar totalt: 60                         │
├─────────────────────────────────────────────────────────┤
│ Utfört arbete:                                          │
│   • Målning av två sidor av väggen                      │
│   • Preparering av yta                                  │
│                                                         │
│ Avvikelser:                                             │
│   • [Om det finns avvikelser]                           │
│                                                         │
│ Anteckningar:                                           │
│   "Kunden var på plats och godkände..."                 │
└─────────────────────────────────────────────────────────┘
```

---

### 3. Arbetsorder - Lägg till beskrivning

**Nuvarande tabell:**
| Order-nr | Titel | Tilldelad | Förfaller | Status |

**Ny tabell:**
| Order-nr | Titel | Beskrivning | Tilldelad | Förfaller | Status |

**Alternativ layout (om beskrivning är lång):**
- Visa varje arbetsorder som ett kort/block istället för tabellrad
- Beskrivning under rubriken

---

### 4. Projektfiler - Bädda in bilder

**Nuvarande:**
```typescript
interface ProjectFile {
  id, file_name, category, created_at
}
```

**Saknas:** `storage_path` för att kunna hämta bilderna

**Lösning:**

1. **Uppdatera datahämtningen** i `ProjectOverviewTab.tsx`:
```typescript
supabase.from("project_files")
  .select("id, file_name, category, created_at, storage_path")
```

2. **Uppdatera interface:**
```typescript
interface ProjectFile {
  id: string;
  file_name: string;
  category: string | null;
  created_at: string;
  storage_path: string; // Lägg till
}
```

3. **Bädda in bilder i PDF:en:**
- För varje fil med `category === "image"`:
  - Hämta bilden från storage via `supabase.storage.from("project-files").getPublicUrl(storage_path)`
  - Konvertera till base64
  - Lägg in i PDF:en med `doc.addImage()`
- Icke-bilder visas bara som filnamn

**Ny layout:**
```text
┌─────────────────────────────────────────────────────────┐
│ Projektfiler & bilagor                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─────────────────────┐                                 │
│ │                     │   ladda-ned-(10).png            │
│ │      [BILD]         │   Uppladdad: 3 februari 2026    │
│ │                     │                                 │
│ └─────────────────────┘                                 │
│                                                         │
│ ┌─────────────────────┐                                 │
│ │                     │   fasad-foto.jpg                │
│ │      [BILD]         │   Uppladdad: 2 februari 2026    │
│ │                     │                                 │
│ └─────────────────────┘                                 │
│                                                         │
│ Övriga filer:                                           │
│   • rapport.pdf (Dokument) - 1 februari 2026            │
└─────────────────────────────────────────────────────────┘
```

---

## Tekniska ändringar

### Fil 1: `src/lib/generateCompleteProjectPdf.ts`

**Ändringar:**

1. **Uppdatera `Phase` interface (rad 51-56):**
```typescript
interface Phase {
  name: string;
  color: string;
  start_week: number;
  duration_weeks: number;
  description?: string | null;  // Lägg till
}
```

2. **Uppdatera `DiaryReport` interface (rad 65-72):**
```typescript
interface DiaryReport {
  id: string;
  report_date: string;
  headcount: number | null;
  total_hours: number | null;
  hours_per_person: number | null;  // Lägg till
  work_items: string[] | null;
  roles: string[] | null;           // Lägg till
  deviations: any | null;           // Lägg till
  extra_work: string[] | null;      // Lägg till
  materials_delivered: string[] | null;  // Lägg till
  materials_missing: string[] | null;    // Lägg till
  notes: string | null;
}
```

3. **Uppdatera `ProjectFile` interface (rad 94-99):**
```typescript
interface ProjectFile {
  id: string;
  file_name: string;
  category: string | null;
  created_at: string;
  storage_path: string;  // Lägg till
}
```

4. **Ändra planerings-sektionen (rad 317-348):**
- Behåll tabellen för översikt
- Lägg till loop efter tabellen som visar beskrivningar per fas

5. **Ändra arbetsdagbok-sektionen (rad 350-384):**
- Ersätt kompakt tabell med detaljerade block per rapport
- Visa alla fält som finns i databasen

6. **Ändra arbetsorder-sektionen (rad 423-450):**
- Lägg till beskrivningskolumn eller byt till block-layout

7. **Ändra projektfiler-sektionen (rad 452-477):**
- Hämta bilder från storage
- Bädda in bilder i PDF:en med `doc.addImage()`
- Visa icke-bilder som lista

---

### Fil 2: `src/components/projects/ProjectOverviewTab.tsx`

**Ändring rad 148-151:**
Lägg till `storage_path` i select:

```typescript
supabase.from("project_files")
  .select("id, file_name, category, created_at, storage_path")
  .eq("project_id", project.id)
  .order("created_at"),
```

---

## Sammanfattning

| Fil | Ändring |
|-----|---------|
| `generateCompleteProjectPdf.ts` | Utöka interfaces, visa fasbeskrivningar, detaljerad dagbok, arbetsorderbeskrivningar, bädda in bilder |
| `ProjectOverviewTab.tsx` | Hämta `storage_path` för projektfiler |

### Förväntad PDF-struktur efteråt

```text
Sida 1: Försättsblad (oförändrat)
Sida 2: Projektöversikt + Offertposter (oförändrat)
Sida 3: ÄTA-arbeten (oförändrat)
Sida 4: Projektplanering (UTÖKAT med fasbeskrivningar)
Sida 5-6: Arbetsdagbok (UTÖKAT med all information)
Sida 7: Arbetsorder (UTÖKAT med beskrivningar)
Sida 8: Projektfiler (UTÖKAT med inbäddade bilder)
Sida 9: Leverantörsfakturor (oförändrat om finns)
Sida 10: Ekonomisk sammanfattning (oförändrat)
```

