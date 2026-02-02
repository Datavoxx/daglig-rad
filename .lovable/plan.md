

## Plan: Employee Dashboard med tre moduler + fixa projekt-dropdown

### Sammanfattning

Du vill ha:
1. En **employee dashboard** som ersätter den vanliga dashboard-vyn för anställda, med tre kompakta moduler: Dagrapporter, Personalliggare, Tidsrapport
2. Fixa **projekt-dropdown** i Dagrapporter så den visar arbetsgivarens projekt

---

### Problem identifierat: Projekt-dropdown är tom

I `DailyReports.tsx` hämtas projekt med en explicit `.eq("user_id", employerId)` filter, men koden hämtar först `employerId` via en separat lookup till `employees`-tabellen. 

Problemet: Denna lookup använder inte korrekt logik och krockar med hur RLS redan fungerar. `AttendanceEmployeeView.tsx` fungerar eftersom den **inte** gör någon explicit filter - den låter RLS-policyn filtrera automatiskt.

**Lösning:** Ta bort den explicita `user_id`-filtern och låt RLS göra jobbet (precis som `AttendanceEmployeeView.tsx` gör).

---

### Ändringar

#### 1. Fixa DailyReports.tsx - Projekthämtning

Ändra från:
```typescript
const employerId = employee?.user_id || user.id;
const { data, error } = await supabase
  .from("projects")
  .select("id, name, client_name")
  .eq("user_id", employerId)  // <-- Ta bort denna filter
```

Till:
```typescript
const { data, error } = await supabase
  .from("projects")
  .select("id, name, client_name")
  .order("created_at", { ascending: false });
// RLS hanterar redan filtrering baserat på get_employer_id(auth.uid())
```

#### 2. Skapa EmployeeDashboard.tsx

En ny sida för anställda som visar tre kort/moduler:
- **Dagrapporter**: Snabbknapp för att gå till dagrapporter + senaste rapport
- **Personalliggare**: Visa aktuell in/ut-status + snabbknapp
- **Tidsrapport**: Veckans timmar + snabbknapp

Layout:
```
+------------------------------------------+
|  Hej, [Namn]! 👋                          |
|  Din arbetsöversikt för idag              |
+------------------------------------------+

+-------------+  +-------------+  +-------------+
| 📋          |  | ✓           |  | ⏱           |
| Dagrapporter|  |Personalligg.|  | Tidsrapport |
| 3 rapporter |  | Incheckad   |  | 32h denna   |
| denna veckan|  | sedan 08:15 |  | vecka       |
| [Öppna →]   |  | [Öppna →]   |  | [Öppna →]   |
+-------------+  +-------------+  +-------------+
```

#### 3. Uppdatera routing i App.tsx

Lägg till route för `/employee-dashboard` alternativt använd `/daily-reports` som startvy (redan implementerat).

**Alternativ approach:** Istället för en separat dashboard-sida kan vi göra `/daily-reports` till en mer komplett "hem"-vy för anställda genom att lägga till snabbkort överst.

---

### Rekommenderad approach: Bygg ut DailyReports som employee "hem"

Istället för att skapa en helt ny dashboard-sida, bygger vi ut `DailyReports.tsx` till att fungera som anställdas hem-vy med:

1. **Överst**: Tre snabbkort (Dagrapporter, Personalliggare, Tidsrapport) med snabbstatus
2. **Under**: Projektval och dagrapport-skapande (som redan finns)
3. **Längst ner**: Lista med senaste dagrapporter

Detta är enklare och håller navigeringen konsekvent.

---

### Filer som ändras

| Fil | Ändring |
|-----|---------|
| `src/pages/DailyReports.tsx` | 1. Ta bort explicit `user_id`-filter vid projekthämtning (låt RLS filtrera) 2. Lägg till tre snabbkort överst med status för varje modul |

---

### Teknisk implementation

**Projekthämtning (fix):**
```typescript
const fetchProjects = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    setLoading(false);
    return;
  }

  // Låt RLS filtrera - den tillåter redan employer's projects via get_employer_id()
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, client_name")
    .order("created_at", { ascending: false });

  if (!error && data) {
    setProjects(data);
    if (data.length > 0) {
      setSelectedProjectId(data[0].id);
    }
  }
  setLoading(false);
};
```

**Snabbkort-sektion (ny):**
```typescript
// Hämta snabbdata för varje modul
const { data: weeklyTimeData } = useQuery({
  queryKey: ["employee-weekly-time"],
  queryFn: async () => {
    // Hämta veckans timmar
  }
});

const { data: activeCheckIn } = useQuery({
  queryKey: ["active-check-in"],
  queryFn: async () => {
    // Hämta aktiv incheckning
  }
});

// Rendera tre kort överst
<div className="grid gap-4 grid-cols-3">
  <QuickCard 
    title="Dagrapporter" 
    value="3 denna vecka" 
    href="/daily-reports" 
    icon={BookOpen}
  />
  <QuickCard 
    title="Personalliggare" 
    value={activeCheckIn ? "Incheckad" : "Ej incheckad"} 
    href="/attendance" 
    icon={ClipboardCheck}
  />
  <QuickCard 
    title="Tidsrapport" 
    value={`${weeklyHours}h denna vecka`} 
    href="/time-reporting" 
    icon={Clock}
  />
</div>
```

---

### Resultat

Efter implementation:
1. ✅ Projekt-dropdown visar alla arbetsgivarens projekt
2. ✅ Anställda ser tre snabbkort överst på Dagrapporter-sidan
3. ✅ Varje kort visar aktuell status och leder till respektive modul
4. ✅ Dagrapporter är fortfarande standardvyn/hem för anställda

