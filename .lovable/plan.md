

## Plan: Separat Employee Dashboard + Säkerställ automatiskt uppsättning för nya organisationer

### Sammanfattning

Du vill ha:
1. **Separat dashboard-sida för anställda** med tre moduler: Dagrapporter, Personalliggare, Tidsrapport
2. **Individuella KPIs** - varje anställd ser endast sin egen data
3. **Säkerställa att nya organisationer automatiskt får rätt uppsättning**

---

### Del 1: Skapa EmployeeDashboard.tsx

En ny sida som ersätter den vanliga dashboarden för anställda.

**Layout och innehåll:**

```
+------------------------------------------+
|  Hej, [Namn]!                             |
|  Din arbetsöversikt                       |
+------------------------------------------+

+-------------+  +-------------+  +-------------+
| Dagrapporter|  |Personalligg.|  | Tidsrapport |
| 3 rapporter |  | Incheckad   |  | 32h denna   |
| denna veckan|  | sedan 08:15 |  | vecka       |
| [Öppna →]   |  | [Öppna →]   |  | [Öppna →]   |
+-------------+  +-------------+  +-------------+

+------------------------------------------+
| Din veckostatistik                        |
| • Dagrapporter: 3 st                      |
| • Arbetade timmar: 32h                    |
| • Checkat in: 5 av 5 dagar                |
+------------------------------------------+
```

**Individuella KPIs (endast användarens egen data):**
- Dagrapporter denna vecka (count från `daily_reports` där `user_id = auth.uid()`)
- Personalliggare-status (aktiv incheckning från `attendance_records` där `user_id = auth.uid()`)
- Tidsrapport timmar denna vecka (summa från `time_entries` där `user_id = auth.uid()`)

---

### Del 2: Uppdatera DailyReports.tsx

Ta bort dashboard-korten från DailyReports-sidan (de ska vara på dashboarden istället). DailyReports blir en ren "skapa/lista dagrapporter"-sida.

---

### Del 3: Routing och navigation

**App.tsx:**
- Lägg till ny route `/employee-dashboard` som pekar på `EmployeeDashboard`
- Skydda med `ProtectedModuleRoute module="daily-reports"` (anställda har alltid denna modul)

**useUserPermissions.ts:**
- Uppdatera `getDefaultRoute()` så att anställda automatiskt skickas till `/employee-dashboard`
- Admins skickas fortfarande till `/dashboard`

**AppLayout.tsx:**
- Logo-klick för anställda → `/employee-dashboard`
- Logo-klick för admins → `/dashboard`

**Navigationsmenyn:**
Anställda ser "Hem" som leder till `/employee-dashboard`

---

### Del 4: Säkerställa automatiskt uppsättning för nya organisationer

**Nuläge (fungerar redan):**
1. `accept-invitation` Edge Function sätter redan rätt behörigheter för nya anställda:
   - `modules: ["attendance", "time-reporting", "daily-reports"]`
2. Database-migrering har redan uppdaterat befintliga anställdas behörigheter
3. `useUserPermissions` har redan hard-restriction som alltid ger anställda endast dessa moduler

**Ingen ytterligare åtgärd krävs** - systemet är redan konfigurerat för att automatiskt ge nya anställda rätt setup.

---

### Filer som ändras

| Fil | Ändring |
|-----|---------|
| `src/pages/EmployeeDashboard.tsx` | **NY FIL** - Dashboard för anställda med tre modulkort och individuella KPIs |
| `src/pages/DailyReports.tsx` | Ta bort dashboard-korten (EmployeeQuickCard), behåll endast projekt-väljare och rapportlista |
| `src/App.tsx` | Lägg till route för `/employee-dashboard` |
| `src/hooks/useUserPermissions.ts` | Uppdatera `getDefaultRoute()` att returnera `/employee-dashboard` för anställda |
| `src/components/layout/AppLayout.tsx` | Uppdatera navigationen så att anställda ser "Hem" som pekar på employee-dashboard |

---

### Teknisk implementation

**EmployeeDashboard.tsx (ny fil):**

```typescript
// Hämtar KPIs endast för den inloggade användaren (eq user_id = auth.uid())
const { data: weeklyReports } = useQuery({
  queryKey: ["my-weekly-reports"],
  queryFn: async () => {
    const { count } = await supabase
      .from("daily_reports")
      .select("*", { count: "exact", head: true })
      .gte("report_date", weekStart)
      .lte("report_date", weekEnd);
    return count || 0;
  }
});

const { data: activeCheckIn } = useQuery({
  queryKey: ["my-active-checkin"],
  queryFn: async () => {
    const { data } = await supabase
      .from("attendance_records")
      .select("check_in")
      .is("check_out", null)
      .order("check_in", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data;
  }
});

const { data: weeklyHours } = useQuery({
  queryKey: ["my-weekly-hours"],
  queryFn: async () => {
    const { data } = await supabase
      .from("time_entries")
      .select("hours")
      .gte("date", weekStart)
      .lte("date", weekEnd);
    return data?.reduce((sum, e) => sum + Number(e.hours), 0) || 0;
  }
});
```

**Navigationsuppdatering:**

```typescript
// I useUserPermissions.ts - getDefaultRoute()
const getDefaultRoute = () => {
  if (isEmployee) return "/employee-dashboard";  // Anställda → employee dashboard
  if (permissions.includes("dashboard")) return "/dashboard";  // Admins → admin dashboard
  if (permissions.length > 0) return `/${permissions[0]}`;
  return "/employee-dashboard";
};

// I navItems (AppLayout.tsx) - visa "Hem" för anställda också
{ label: "Hem", href: isEmployee ? "/employee-dashboard" : "/dashboard", icon: Home, moduleKey: "daily-reports" }
```

---

### Resultat efter implementation

1. **Anställda loggar in** → hamnar på `/employee-dashboard`
2. **Employee dashboard visar**:
   - Tre klickbara modulkort (Dagrapporter, Personalliggare, Tidsrapport)
   - Individuella KPIs (endast deras egen data)
3. **Klicka på "Dagrapporter"** → går till `/daily-reports` där de kan välja projekt och skapa rapporter
4. **Klicka på "Personalliggare"** → går till `/attendance` för in/utcheckning
5. **Klicka på "Tidsrapport"** → går till `/time-reporting` för tidsregistrering
6. **Admins** fortsätter att se sin vanliga dashboard med alla KPIs och full åtkomst
7. **Nya anställda** får automatiskt rätt uppsättning via `accept-invitation`

---

### Säkerhet

- RLS på `daily_reports`, `attendance_records`, `time_entries` säkerställer att anställda endast ser sin egen data
- `useUserPermissions` hard-restriction säkerställer att anställda aldrig får tillgång till projekt/offerter/fakturor
- Inga ändringar behövs i backend - allt är redan korrekt konfigurerat

