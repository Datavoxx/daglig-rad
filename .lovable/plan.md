

## Plan: Tre förbättringar - Artiklar, Anställdas åtkomst och Dagrapporter

Jag har undersökt kodbasen och identifierat följande behov:

---

### 1. Artikelbibliotek visar inga artiklar i offerten

**Problem:**
Artikelbiblioteket i offertverktyget (`ArticleLibrarySection.tsx`) hämtar endast artiklar för den **inloggade användaren** (`user_id = auth.uid()`). Detta innebär att biblioteket fungerar korrekt - det visar dina artiklar om de har skapats.

**Diagnos:**
Det verkar som att du kanske inte har lagt till några artiklar ännu i Inställningar → Artiklar. Komponenten är korrekt implementerad och visar artiklar som finns i databasen.

**Åtgärd:**
Ingen kodändring behövs. Lägg till artiklar via Inställningar → Artiklar-fliken så visas de automatiskt i offertverktyget.

---

### 2. Anställdas tillgång till arbetsgivarens projekt

**Nuvarande status:**
- Projekt-tabellen har korrekt RLS: `(auth.uid() = user_id) OR (user_id = get_employer_id(auth.uid()))`
- Anställda **kan** se arbetsgivarens projekt via RLS
- **Problemet:** Dagrapporter (`daily_reports`) har RLS som endast tillåter `auth.uid() = user_id` - anställda kan inte se/skapa dagrapporter för arbetsgivarens projekt

**Vad som behöver fixas:**

| Tabell | Nuvarande RLS | Ny RLS |
|--------|---------------|--------|
| `daily_reports` | `auth.uid() = user_id` | `auth.uid() = user_id OR user_id = get_employer_id(auth.uid())` |

---

### 3. Ta bort "Projekt" och behålla endast Dagrapporter för anställda

**Nuvarande status:**
Edge-funktionen `accept-invitation` sätter redan moduler till `["attendance", "time-reporting", "daily-reports"]` - "projects" är **inte inkluderat**.

**Problem:**
DailyReports-sidan (`/daily-reports`) försöker hämta projekt och dagrapporter med fel logik. Den gör:
1. Hämtar projekt via arbetsgivar-logik (fungerar via RLS)
2. Men dagrapporter blockeras av RLS eftersom `user_id` inte matchar

**Lösning:**
1. **Uppdatera RLS på `daily_reports`** för att tillåta anställda att läsa/skriva arbetsgivarens rapporter
2. **Förbättra DailyReports-sidan** för att visa arbetsgivarens dagrapporter korrekt
3. **Navigering är redan korrekt** - anställda ser inte "Projekt" eftersom de inte har `projects` i sina behörigheter

---

### Teknisk implementation

#### RLS-migration för `daily_reports`

```sql
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own reports" ON daily_reports;
DROP POLICY IF EXISTS "Users can insert own reports" ON daily_reports;
DROP POLICY IF EXISTS "Users can update own reports" ON daily_reports;
DROP POLICY IF EXISTS "Users can delete own reports" ON daily_reports;

-- Create new policies that include employer relationship
CREATE POLICY "Users and employees can view reports"
  ON daily_reports FOR SELECT
  USING (
    auth.uid() = user_id 
    OR user_id = get_employer_id(auth.uid())
  );

CREATE POLICY "Users and employees can insert reports"
  ON daily_reports FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    OR user_id = get_employer_id(auth.uid())
  );

CREATE POLICY "Users and employees can update reports"
  ON daily_reports FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR user_id = get_employer_id(auth.uid())
  );

CREATE POLICY "Users and employees can delete reports"
  ON daily_reports FOR DELETE
  USING (
    auth.uid() = user_id 
    OR user_id = get_employer_id(auth.uid())
  );
```

#### Uppdatera DailyReports.tsx

Ändra `fetchReports`-funktionen för att skicka `user_id` korrekt när anställda skapar rapporter:

```typescript
// När anställd skapar rapport, sätt user_id till arbetsgivaren
const employerId = employee?.user_id || user.id;

// Vid insert av rapport
await supabase.from('daily_reports').insert({
  project_id: selectedProjectId,
  user_id: employerId,  // Viktigt: Använd arbetsgivarens ID
  ...reportData
});
```

---

### Sammanfattning av ändringar

| Fil | Ändring |
|-----|---------|
| `supabase/migrations/xxx_daily_reports_employee_access.sql` | **NY** - Uppdaterad RLS för dagrapporter |
| `src/pages/DailyReports.tsx` | Fixa user_id vid insert för anställda |
| `src/components/projects/ProjectDiaryTab.tsx` | Fixa user_id vid insert för anställda |

---

### Resultat efter implementation

1. **Artikelbiblioteket** fungerar redan - lägg bara till artiklar via Inställningar
2. **Anställda ser arbetsgivarens dagrapporter** via uppdaterad RLS
3. **Navigationen är korrekt** - anställda ser inte "Projekt" utan har tillgång till "Dagrapporter", "Tidsrapport" och "Personalliggare"
4. **Anställda kan skapa dagrapporter** som kopplas till arbetsgivarens konto

