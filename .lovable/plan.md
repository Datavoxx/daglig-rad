
## Plan: Anställdas Företagsdata + Begränsad Åtkomst + Tidsrapportering

### Sammanfattning
När en anställd accepterar sin inbjudan ska de automatiskt ärva arbetsgivarens företagsuppgifter och få begränsad åtkomst. Vi skapar också en dedikerad tidsrapporteringsvy.

---

### Del 1: Automatisk Kopiering av Företagsdata

**Ändring i `accept-invitation` edge function:**

Efter att användarkontot skapats, kopiera arbetsgivarens `company_settings` till den nya anställda:

```
1. Hämta arbetsgivarens company_settings (via invited_by)
2. Skapa en kopia med den anställdas user_id
3. Anställda slipper onboarding-wizarden
```

| Fil | Ändring |
|-----|---------|
| `supabase/functions/accept-invitation/index.ts` | Lägg till logik för att kopiera `company_settings` från arbetsgivare till anställd |

---

### Del 2: Begränsade Moduler för Anställda

**Ändring i `accept-invitation` edge function:**

Istället för att låta `handle_new_user`-triggern sätta full åtkomst, uppdatera den anställdas `user_permissions` med begränsade moduler.

| Anställdas moduler | Beskrivning |
|--------------------|-------------|
| `dashboard` | Översikt |
| `projects` | Se tilldelade projekt (vi filtrerar senare på klientsidan) |

**Ny logik:**
```
1. Efter användare skapats
2. Uppdatera user_permissions för anställd
3. Sätt modules = ['dashboard', 'projects']
```

---

### Del 3: Tidsrapporteringsvy

**Ny sida: `src/pages/TimeReporting.tsx`**

En enkel vy för anställda att:
- Se sina tilldelade projekt
- Rapportera tid per projekt
- Se sina tidigare tidsrapporter

**Ny tabell i databasen: `time_entries`**

| Kolumn | Typ | Beskrivning |
|--------|-----|-------------|
| id | uuid | Primärnyckel |
| user_id | uuid | Den anställdas user ID |
| employer_id | uuid | Arbetsgivarens user ID |
| project_id | uuid | Projektet som tiden gäller |
| date | date | Datum för arbetet |
| hours | numeric | Antal arbetade timmar |
| description | text | Beskrivning av arbetet |
| billing_type_id | uuid | Länk till debiteringstyp |
| created_at | timestamp | Skapad |

**RLS-policies:**
- Anställda kan CRUD sina egna poster
- Arbetsgivare kan läsa alla posters från sina anställda

---

### Del 4: Routing och Navigation

**Ändringar i `App.tsx`:**
- Lägg till route `/time-reporting`

**Anpassad navigation för anställda:**
- Visa endast relevanta menyalternativ (Dashboard, Projekt, Tidsrapportering)
- Dölj administrativa vyer (Inställningar, Ekonomi, Kunder, etc.)

---

### Implementationsordning

```text
┌─────────────────────────────────────────────────────────┐
│ Steg 1: Databasschema                                   │
│ - Skapa time_entries tabell med RLS                     │
└────────────────────────┬────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────┐
│ Steg 2: Edge Function Uppdatering                       │
│ - Kopiera company_settings till anställd                │
│ - Sätt begränsade moduler för anställd                  │
└────────────────────────┬────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────┐
│ Steg 3: Frontend                                        │
│ - TimeReporting.tsx sida                                │
│ - Anpassad navigation för anställda                     │
│ - Uppdatera useUserPermissions för att läsa metadata    │
└─────────────────────────────────────────────────────────┘
```

---

### Tekniska Detaljer

**accept-invitation/index.ts - Nya tillägg:**

```typescript
// Efter userId skapats, lägg till:

// 1. Hämta arbetsgivarens company_settings
const { data: employerSettings } = await supabase
  .from("company_settings")
  .select("*")
  .eq("user_id", invitation.invited_by)
  .single();

// 2. Kopiera till anställd (exkludera id och user_id)
if (employerSettings) {
  const { id, user_id, ...settingsToCopy } = employerSettings;
  await supabase.from("company_settings").insert({
    ...settingsToCopy,
    user_id: userId,
    updated_at: new Date().toISOString(),
  });
}

// 3. Uppdatera moduler till begränsad åtkomst
await supabase
  .from("user_permissions")
  .update({ modules: ["dashboard", "projects"] })
  .eq("user_id", userId);
```

**Ny SQL-migration:**

```sql
-- Skapa time_entries tabell
CREATE TABLE public.time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  employer_id UUID NOT NULL,
  project_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  hours NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  billing_type_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Anställda kan hantera sina egna tider
CREATE POLICY "Users can manage own time entries"
  ON time_entries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Arbetsgivare kan se sina anställdas tider
CREATE POLICY "Employers can view employee time entries"
  ON time_entries FOR SELECT
  USING (auth.uid() = employer_id);
```

---

### Resultat

Efter implementation:
1. **Anställda loggar in** → Direkt till dashboard, ingen onboarding
2. **Begränsad meny** → Endast Dashboard, Projekt, Tidsrapportering
3. **Tidsrapportering** → Enkel vy för att logga arbetade timmar
4. **Arbetsgivare ser** → Alla anställdas tidrapporter i sin vy

