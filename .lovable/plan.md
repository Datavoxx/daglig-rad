
## Plan: Organisations- och Tidsrapporteringssystem (Steg 1 - Grunden)

### Sammanfattning

Detta är **Steg 1** av ett större system för att hantera anställda med begränsad åtkomst och tidsrapportering. I detta steg bygger vi grunden:
1. Lägg till organisationsnamn i företagsinställningar
2. Förenkla anställda-formuläret (ta bort roll/timpris)
3. Skapa ny flik "Debiteringstyper" för löne-/arbetstyper

---

### Del 1: Lägg till Organisationsnamn i Företagsinställningar

**Varför?** Organisationsnamnet används för att identifiera företaget internt och blir viktigt när anställda bjuds in senare.

**Databasändring:**
```sql
ALTER TABLE company_settings 
ADD COLUMN IF NOT EXISTS organization_name text;
```

**UI-ändring i Settings.tsx:**
- Lägg till ett nytt fält "Organisationsnamn" bredvid Företagsnamn
- Organisationsnamn är det interna namnet som anställda ser
- Företagsnamn är det som visas på offerter/dokument

---

### Del 2: Förenkla Anställda-formuläret

**Vad tas bort:**
- Roll/Titel (flyttas till debiteringstyper vid tidsrapportering)
- Timpris (hanteras via debiteringstyper)

**Vad behålls:**
- Namn (obligatoriskt)
- Telefon
- E-post

**Databasändring:**
- Kolumnerna `role` och `hourly_rate` behålls i databasen för bakåtkompatibilitet
- UI:t döljer dem bara

**UI-ändring i EmployeeManager.tsx:**
- Ta bort Roll/Titel-fältet från formuläret
- Ta bort Timpris-fältet från formuläret
- Ta bort visning av roll i listan

---

### Del 3: Ny flik "Debiteringstyper"

**Inspiration:** Bygglets debiteringstyper med Namn, Förkortning, Pris, Sorteringsordning, Status

**Ny databastabell: `billing_types`**
```sql
CREATE TABLE billing_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,                    -- Ex: "Ordinarie tid", "Målare", "Bygg"
  abbreviation text NOT NULL,            -- Ex: "Ord", "Mål", "Bygg"
  hourly_rate numeric DEFAULT 0,         -- Timpris för denna typ
  sort_order integer DEFAULT 0,          -- Sorteringsordning
  is_active boolean DEFAULT true,        -- Aktiv/Inaktiv
  billing_category text DEFAULT 'work',  -- 'work' eller 'expense'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS-policies
ALTER TABLE billing_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own billing types"
  ON billing_types FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own billing types"
  ON billing_types FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own billing types"
  ON billing_types FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own billing types"
  ON billing_types FOR DELETE USING (auth.uid() = user_id);
```

**Ny komponent: BillingTypeManager.tsx**

Liknande struktur som EmployeeManager med:
- Tabell som visar: Namn | Förkortning | Pris | Sortering | Status
- "Lägg till debiteringstyp"-knapp
- Dialog för att skapa/redigera debiteringstyp
- Möjlighet att aktivera/inaktivera (inte radera - för historik)

**UI-ändring i Settings.tsx:**
- Lägg till ny tab "Debiteringstyper" efter "Anställda"

---

### Filöversikt

| Fil | Ändring |
|-----|---------|
| `company_settings` (DB) | Lägg till `organization_name` kolumn |
| `billing_types` (DB) | Ny tabell för debiteringstyper |
| `src/pages/Settings.tsx` | Lägg till organisationsnamn-fält + ny tab för debiteringstyper |
| `src/components/settings/EmployeeManager.tsx` | Ta bort roll och timpris från formulär |
| `src/components/settings/BillingTypeManager.tsx` | Ny komponent för att hantera debiteringstyper |

---

### Visuell förändring

**Inställningar - Flikar (efter):**
```
[ Mallar ] [ Företag ] [ Anställda ] [ Debiteringstyper ]
```

**Företagsfliken (ny rad):**
```
┌─────────────────────────────────────────────────────────┐
│ FÖRETAGSNAMN              ORGANISATIONSNUMMER           │
│ [AB Byggföretaget]        [556677-8899]                 │
│                                                         │
│ ORGANISATIONSNAMN (nytt)                                │
│ [Byggföretaget]           (Visas för anställda)         │
└─────────────────────────────────────────────────────────┘
```

**Anställda-formulär (förenklat):**
```
┌────────────────────────────────────┐
│ Lägg till anställd                 │
│                                    │
│ NAMN *                             │
│ [Erik Svensson]                    │
│                                    │
│ TELEFON           E-POST           │
│ [070-123 45 67]   [erik@ex.se]     │
│                                    │
│         [Avbryt] [Lägg till]       │
└────────────────────────────────────┘
```

**Debiteringstyper (ny vy):**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 💰 Debiteringstyper                               [+ Lägg till]             │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ NAMN           │ FÖRKORTNING │ PRIS   │ SORTERING │ STATUS   │         │ │
│ ├─────────────────────────────────────────────────────────────────────────┤ │
│ │ Ordinarie tid  │ Ord         │ 0 kr   │ 1         │ Aktiv    │ ✏️ 🗑️  │ │
│ │ Målare         │ Mål         │ 550 kr │ 2         │ Aktiv    │ ✏️ 🗑️  │ │
│ │ Bygg           │ Bygg        │ 550 kr │ 3         │ Aktiv    │ ✏️ 🗑️  │ │
│ │ Anläggare      │ ANL         │ 550 kr │ 4         │ Aktiv    │ ✏️ 🗑️  │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Vad som kommer i Steg 2 (nästa omgång)

- Inbjudningssystem via e-post för anställda
- Separat inloggningsportal för anställda
- Tidsrapporteringsmodul med lön- och debiteringstyp per rad
- Koppling mellan anställd-användare och organisation

---

### Teknisk sammanfattning

1. **Databas:** 1 ny tabell (`billing_types`), 1 ny kolumn (`organization_name`)
2. **Nya komponenter:** `BillingTypeManager.tsx`
3. **Uppdaterade komponenter:** `Settings.tsx`, `EmployeeManager.tsx`
4. **Inga breaking changes** - befintliga data påverkas ej

